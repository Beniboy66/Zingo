import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const getBaseURL = () => {
  if (Platform.OS === 'android') {
    // Dispositivo físico: usar IP local de la computadora
    // Emulador Android: usar 10.0.2.2
    return 'http://192.168.0.108:3000/api';
  }
  // iOS simulator
  return 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getBaseURL()
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('zingo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('zingo_token');
      await AsyncStorage.removeItem('zingo_usuario');
    }
    return Promise.reject(error);
  }
);

// Cambiar la URL base segun plataforma
export const setBaseURL = (url) => {
  api.defaults.baseURL = url;
};

export default api;
