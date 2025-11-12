// API client setup with axios
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { dataCache, CACHE_KEYS } from './data-cache';
import { offlineApi } from './offline/offline-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create the base axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Token refresh
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Redirect to login on 401
        localStorage.removeItem('accessToken');
        // Only redirect if we're not already on the login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 401 errors that don't have a retry (e.g., refresh token expired)
    if (error.response?.status === 401) {
      // Clear token and redirect to login immediately
      localStorage.removeItem('accessToken');
      // Use setTimeout to ensure redirect happens in next tick
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        setTimeout(() => {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }, 0);
      }
    }

    return Promise.reject(error);
  },
);

// Check if URL is an authentication endpoint that should bypass offline wrapper
const isAuthEndpoint = (url: string): boolean => {
  return url.startsWith('/auth/') || url === '/auth';
};

// Create API wrapper with offline support
const createApi = (instance: AxiosInstance) => {
  const api = {
    // GET request - uses offline API for caching and offline support
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      // Bypass offline wrapper for auth endpoints
      if (isAuthEndpoint(url)) {
        return instance.get<T>(url, config);
      }
      return offlineApi.get<T>(url, config);
    },

    // POST request - uses offline API for queuing
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      // Bypass offline wrapper for auth endpoints (login, refresh, logout)
      if (isAuthEndpoint(url)) {
        return instance.post<T>(url, data, config);
      }
      return offlineApi.post<T>(url, data, config);
    },

    // PUT request - uses offline API for queuing
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      // Bypass offline wrapper for auth endpoints
      if (isAuthEndpoint(url)) {
        return instance.put<T>(url, data, config);
      }
      return offlineApi.put<T>(url, data, config);
    },

    // PATCH request - uses offline API for queuing
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      // Bypass offline wrapper for auth endpoints
      if (isAuthEndpoint(url)) {
        return instance.patch<T>(url, data, config);
      }
      return offlineApi.patch<T>(url, data, config);
    },

    // DELETE request - uses offline API for queuing
    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      // Bypass offline wrapper for auth endpoints
      if (isAuthEndpoint(url)) {
        return instance.delete<T>(url, config);
      }
      return offlineApi.delete<T>(url, config);
    },

    // HEAD request
    head: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      return instance.head<T>(url, config);
    },

    // OPTIONS request
    options: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      return instance.options<T>(url, config);
    },

    // Direct call (for interceptors and advanced usage)
    request: <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      return instance.request<T>(config);
    },

    // Expose interceptors for compatibility
    interceptors: instance.interceptors,

    // Expose default config
    defaults: instance.defaults,

    // Expose getUri method
    getUri: (config?: AxiosRequestConfig): string => {
      return instance.getUri(config);
    },
  };

  return api;
};

// Helper function to get cache key from URL
function getCacheKey(url: string): string | null {
  // Map API endpoints to cache keys
  if (url === '/games' || url.startsWith('/games?')) {
    return CACHE_KEYS.GAMES;
  }
  if (url === '/tables' || url.startsWith('/tables?')) {
    return CACHE_KEYS.TABLES;
  }
  if (url === '/products' || url.startsWith('/products?')) {
    return CACHE_KEYS.PRODUCTS;
  }
  if (url.startsWith('/inventory')) {
    return CACHE_KEYS.INVENTORY;
  }
  if (url === '/shifts' || url.startsWith('/shifts?')) {
    return CACHE_KEYS.SHIFTS;
  }
  if (url.startsWith('/users')) {
    return CACHE_KEYS.USERS;
  }
  if (url.startsWith('/sales')) {
    return CACHE_KEYS.SALES;
  }
  if (url.startsWith('/expenses')) {
    return CACHE_KEYS.EXPENSES;
  }
  
  // For specific resource endpoints, don't cache (e.g., /tables/:id)
  if (url.match(/\/\w+\/[^\/]+$/)) {
    return null;
  }
  
  return null;
}

// Export the API instance
export const api = createApi(axiosInstance) as AxiosInstance;

export default api;
