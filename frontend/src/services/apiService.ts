const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({} as any));
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
    return response.json();
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
    }
  },

  async uploadFile(file: File, type: 'avatar' | 'item' | 'drop' = 'avatar'): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Upload Error: ${response.statusText}`);
    }

    return response.json();
  },
};
