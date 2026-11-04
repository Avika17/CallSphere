import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/users';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically attach authorization header if needed in the future
// Note: Currently, the backend expects tokens directly inside request body or query params.
api.interceptors.request.use(
  (config) => {
    // We can fetch token from local storage here if needed,
    // but we will pass it explicitly to match the exact controller signatures.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
