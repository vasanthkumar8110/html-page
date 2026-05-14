import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export const apiClient = axios.create({
  baseURL: 'https://cloud-backend-ipa.onrender.com/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = storage.getString('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = storage.getString('refreshToken');
      
      if (refreshToken) {
        try {
          const { data } = await axios.post('https://cloud-backend-ipa.onrender.com/api/v1/auth/refresh', {
            refreshToken,
          });
          
          storage.set('accessToken', data.accessToken);
          storage.set('refreshToken', data.refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          storage.delete('accessToken');
          storage.delete('refreshToken');
          // Handle redirect to login if necessary
        }
      }
    }
    return Promise.reject(error);
  }
);
