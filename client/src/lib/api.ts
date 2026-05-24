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

// ========================
// Upload API
// ========================

export const uploadApi = {
  profileImage: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    // Note: Progress tracking requires XMLHttpRequest; for now use simple fetch
    return request<{ url: string }>('/upload/profile-image', {
      method: 'POST',
      body: formData,
    });
  },

  projectMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string; thumbnailUrl?: string; aspectRatio?: string }>('/upload/project-media', {
      method: 'POST',
      body: formData,
    });
  },

  showreel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string; thumbnailUrl?: string }>('/upload/showreel', {
      method: 'POST',
      body: formData,
    });
  },
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
