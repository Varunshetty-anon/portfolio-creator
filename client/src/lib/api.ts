// ========================
// FRAMES API Client
// ========================
// Centralized HTTP client for all backend communication.
// All requests go through the Vite dev proxy (/api → localhost:5000).

import type { ApiResponse } from '@/types';

const API_BASE = '/api/v1';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    credentials: 'include', // Send cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData (browser sets multipart boundary)
  if (options.body instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status
    );
  }

  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new ApiError(data.error || 'Unknown error', response.status);
  }

  return data.data as T;
}

// ========================
// Auth API
// ========================

export const authApi = {
  signup: (email: string, password: string, displayName: string) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Google OAuth is initiated by navigating to this URL
  googleAuthUrl: `${API_BASE}/auth/google`,

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  getMe: () =>
    request(`/auth/me?_t=${Date.now()}`),

  deleteAccount: () =>
    request('/auth/account', { method: 'DELETE' }),
};

// ========================
// Portfolio API
// ========================

export const portfolioApi = {
  get: () =>
    request(`/portfolio?_t=${Date.now()}`),

  create: (data: any) =>
    request('/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (data: any) =>
    request('/portfolio', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  publish: () =>
    request('/portfolio/publish', { method: 'POST' }),

  unpublish: () =>
    request('/portfolio/unpublish', { method: 'POST' }),

  checkUsername: (username: string) =>
    request<{ available: boolean }>(`/portfolio/check-username/${encodeURIComponent(username)}`),

  getPublic: (username: string) =>
    request(`/portfolio/public/${encodeURIComponent(username)}`),

  getStats: () =>
    request('/portfolio/stats'),
};

import axios, { type AxiosProgressEvent } from 'axios';

// ========================
// Upload API
// ========================

export const uploadApi = {
  profileImage: async (file: File, onProgress?: (e: AxiosProgressEvent) => void, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post<{ success: boolean; data: { url: string } }>('/api/v1/upload/profile-image', formData, {
        withCredentials: true,
        onUploadProgress: onProgress,
        signal
      });
      return res.data.data;
    } catch (err: any) {
      throw new ApiError(err.response?.data?.error || 'Upload failed', err.response?.status || 500);
    }
  },

  projectMedia: async (file: File, onProgress?: (e: AxiosProgressEvent) => void, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append('media', file);
    try {
      const res = await axios.post<{ success: boolean; data: { url: string; thumbnailUrl?: string; aspectRatio?: string } }>('/api/v1/upload/project-media', formData, {
        withCredentials: true,
        onUploadProgress: onProgress,
        signal
      });
      return res.data.data;
    } catch (err: any) {
      throw new ApiError(err.response?.data?.error || 'Upload failed', err.response?.status || 500);
    }
  },

  showreel: async (file: File, onProgress?: (e: AxiosProgressEvent) => void, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append('video', file);
    try {
      const res = await axios.post<{ success: boolean; data: { url: string; thumbnailUrl?: string } }>('/api/v1/upload/showreel', formData, {
        withCredentials: true,
        onUploadProgress: onProgress,
        signal
      });
      return res.data.data;
    } catch (err: any) {
      throw new ApiError(err.response?.data?.error || 'Upload failed', err.response?.status || 500);
    }
  },

  validateDrive: async (url: string) => {
    try {
      const res = await axios.post<{ success: boolean; data: { isPrivate: boolean; isValid: boolean } }>('/api/v1/upload/validate-drive', { url }, {
        withCredentials: true
      });
      return res.data.data;
    } catch (err: any) {
      throw new ApiError(err.response?.data?.error || 'Validation failed', err.response?.status || 500);
    }
  }
};

// ========================
// Analytics API
// ========================

export const analyticsApi = {
  trackView: (portfolioId: string) =>
    request(`/analytics/view/${portfolioId}`, { method: 'POST' }).catch(() => {}),

  trackClick: (portfolioId: string, metadata: any) =>
    request(`/analytics/click/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify({ type: 'click', metadata }),
    }).catch(() => {}),

  getSummary: () =>
    request('/analytics/summary'),
};

export { ApiError };
