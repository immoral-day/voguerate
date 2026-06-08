const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
const API_ORIGIN = new URL(API_BASE_URL, APP_ORIGIN).origin;

const normalizeStorageUrl = (value: string) => {
  if (value.startsWith('/storage/')) return `${API_ORIGIN}${value}`;
  if (value.startsWith('storage/')) return `${API_ORIGIN}/${value}`;
  try {
    const url = new URL(value);
    if (url.pathname.startsWith('/storage/')) {
      return `${API_ORIGIN}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return value;
  }
  return value;
};

const normalizeApiPayload = <T>(payload: T): T => {
  if (typeof payload === 'string') return normalizeStorageUrl(payload) as T;
  if (Array.isArray(payload)) return payload.map((item) => normalizeApiPayload(item)) as T;
  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, normalizeApiPayload(value)])
    ) as T;
  }
  return payload;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const transientStatuses = new Set([500, 502, 503, 504]);

const authHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('authToken');

  if (!token) return {};

  return {
    'Authorization': `Bearer ${token}`,
  };
};

const handleUnauthorized = (endpoint: string) => {
  if (typeof window === 'undefined' || endpoint.endsWith('/login')) return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUserId');
  window.dispatchEvent(new Event('auth:unauthorized'));
};

const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit, retries = 2): Promise<Response> => {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (!transientStatuses.has(response.status) || attempt === retries) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    }

    await wait(350 * (attempt + 1));
  }

  if (lastResponse) return lastResponse;
  throw lastError;
};

type UploadType = 'avatar' | 'profile' | 'item' | 'drop' | 'article';

const uploadMaxSide: Record<UploadType, number> = {
  avatar: 512,
  profile: 1600,
  item: 1400,
  drop: 1400,
  article: 1400,
};

const loadImageForCanvas = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    image.src = url;
  });
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const compressImageForUpload = async (file: File, type: UploadType): Promise<File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 350_000 || typeof window === 'undefined') {
    return file;
  }

  try {
    const image = await loadImageForCanvas(file);
    const sourceWidth = image.width;
    const sourceHeight = image.height;
    const maxSide = uploadMaxSide[type];
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));

    if (scale >= 1 && file.size < 900_000) {
      return file;
    }

    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);
    if ('close' in image && typeof image.close === 'function') {
      image.close();
    }

    const blob = await canvasToBlob(canvas, 'image/webp', 0.82);
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, '') || 'upload';
    return new File([blob], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        ...authHeaders(),
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) handleUnauthorized(endpoint);
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }
    return normalizeApiPayload(await response.json());
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    }, endpoint.endsWith('/login') ? 2 : 0);
    if (!response.ok) {
      const error = await response.json().catch(() => ({} as Record<string, unknown>));
      let message: string | undefined = error.message;
      if (response.status === 401) handleUnauthorized(endpoint);

      // Laravel валидация может возвращать { error: { field: [msg] } }
      if (!message && error.error) {
        if (typeof error.error === 'string') {
          message = error.error;
        } else if (typeof error.error === 'object') {
          const firstKey = Object.keys(error.error)[0];
          const firstVal = firstKey ? error.error[firstKey] : undefined;
          if (Array.isArray(firstVal)) {
            message = firstVal[0];
          } else if (typeof firstVal === 'string') {
            message = firstVal;
          }
        }
      }

      throw new Error(message || `API Error: ${response.statusText}`);
    }
    return normalizeApiPayload(await response.json());
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) handleUnauthorized(endpoint);
      throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
    }
    return normalizeApiPayload(await response.json());
  },

  async delete<T = void>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...authHeaders(),
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) handleUnauthorized(endpoint);
      throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return text ? normalizeApiPayload(JSON.parse(text)) as T : undefined as T;
  },

  async uploadFile(file: File, type: UploadType = 'avatar'): Promise<{ url: string; path: string; relativePath?: string }> {
    const preparedFile = await compressImageForUpload(file, type);
    const formData = new FormData();
    formData.append('file', preparedFile);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) handleUnauthorized('/upload');
      throw new Error(error.error || `Upload Error: ${response.statusText}`);
    }

    return normalizeApiPayload(await response.json());
  },
};
