'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Decode JWT to get user info (basic implementation)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.sub,
          username: payload.username,
          name: payload.name || payload.username,
          role: payload.role,
        });
        // Store userId for API calls
        localStorage.setItem('userId', payload.sub);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return { user, loading, logout, isAuthenticated: !!user };
}

