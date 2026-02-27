import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('allstars_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});