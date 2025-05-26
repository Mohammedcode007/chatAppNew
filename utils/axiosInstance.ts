// src/utils/axiosInstance.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/config';

const axiosInstance = axios.create({
  baseURL: API_URL, // يفضل لاحقًا نقله إلى config.ts
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة التوكن تلقائيًا من التخزين المحلي في كل طلب
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
