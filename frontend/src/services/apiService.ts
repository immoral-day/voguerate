const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
const API_ORIGIN = new URL(API_BASE_URL, APP_ORIGIN).origin;

const normalizeStorageUrl = (value: string) => {
  if (value.startsWith('/storage/')) return `${API_ORIGIN}${value}`;
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

  const userId = localStorage.getItem('currentUserId');
  const token = localStorage.getItem('authToken');

  if (!userId || !token) return {};

  return {
    'X-User-Id': userId,
    'X-Auth-Token': token,
  };
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
      throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
    }
    return normalizeApiPayload(await response.json());
  },

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...authHeaders(),
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
    }
  },

  async uploadFile(file: File, type: 'avatar' | 'profile' | 'item' | 'drop' | 'article' = 'avatar'): Promise<{ url: string; path: string; relativePath?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Upload Error: ${response.statusText}`);
    }

    return normalizeApiPayload(await response.json());
  },
};
