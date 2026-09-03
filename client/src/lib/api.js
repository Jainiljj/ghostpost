import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ghostpost_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent automatic token refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Handle expired or missing session
      const errCode = error.response.data?.code;
      if (errCode === 'SESSION_EXPIRED' || errCode === 'USER_NOT_FOUND') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('ghostpost_refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Request new session tokens
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            token: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          
          localStorage.setItem('ghostpost_accessToken', accessToken);
          localStorage.setItem('ghostpost_refreshToken', newRefreshToken);

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          processQueue(null, accessToken);
          isRefreshing = false;

          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // Clear local storage on session failure
          localStorage.removeItem('ghostpost_accessToken');
          localStorage.removeItem('ghostpost_refreshToken');
          window.dispatchEvent(new Event('ghostpost_session_invalid'));
          
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
