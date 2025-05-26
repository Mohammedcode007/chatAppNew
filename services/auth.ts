// src/services/auth.ts

import axios from '@/utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await axios.post('/login', {
      username,
      password,
    });

    if (response.status === 200 && response.data.token) {
      const { token, user } = response.data;

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');

      return { success: true, user, token };
    } else {
      return { success: false, message: 'Authentication failed. No token.' };
    }
  } catch (error: any) {
    console.error('Login error:', error?.response || error?.message || error);
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Server error. Please try again later.',
    };
  }
};
