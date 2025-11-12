// API client setup with axios
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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

// Export the API instance directly
export const api = axiosInstance;

export default api;
