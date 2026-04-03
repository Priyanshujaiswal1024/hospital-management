import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
});

// Auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Retry on 500 (Render cold start wake-up)
api.interceptors.response.use(
    response => response,
    async error => {
        const config = error.config;
        if (!config._retryCount) config._retryCount = 0;

        const shouldRetry =
            config._retryCount < 3 &&
            (error.response?.status === 500 || !error.response); // 500 or network error

        if (shouldRetry) {
            config._retryCount += 1;
            const delay = config._retryCount * 3000; // 3s, 6s, 9s
            await new Promise(resolve => setTimeout(resolve, delay));
            return api(config);
        }

        return Promise.reject(error);
    }
);

// 👇 Yeh line backend ko app open hote hi jagati hai (Render cold start fix)
api.get('/public/departments').catch(() => {});

export default api;