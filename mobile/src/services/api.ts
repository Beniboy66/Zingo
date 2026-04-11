import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración base de la API
const API_BASE_URL = 'http://localhost:3000/api'; // Cambia esto por tu IP/URL del backend

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Servicios de API
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (userData: any) =>
    api.post('/auth/registro', userData),
};

export const routesService = {
  getRoutes: () => api.get('/rutas'),
  getRoute: (id: string) => api.get(`/rutas/${id}`),
};

export const stopsService = {
  getNearbyStops: (lat: number, lng: number, limit?: number) =>
    api.get(`/cercana?lat=${lat}&lng=${lng}&limite=${limit || 5}`),
};

export const reportsService = {
  createReport: (reportData: any) => api.post('/reportes', reportData),
  getReportsByRoute: (routeId: string) => api.get(`/reportes/ruta/${routeId}`),
  voteReport: (voteData: any) => api.post('/votos', voteData),
};

export const notificationsService = {
  getNotifications: () => api.get('/notificaciones'),
  markAsRead: (id: string) => api.put(`/notificaciones/${id}`),
  markAllAsRead: () => api.put('/notificaciones/leer-todas'),
};

export const favoritesService = {
  getFavorites: () => api.get('/favoritos'),
  addFavorite: (routeId: string) => api.post('/favoritos', { rutaId: routeId }),
  removeFavorite: (routeId: string) => api.delete(`/favoritos/${routeId}`),
};

export const estimationService = {
  getEstimation: (rutaId: string, origenId: string, destinoId: string) =>
    api.get(`/estimacion?rutaId=${rutaId}&origenId=${origenId}&destinoId=${destinoId}`),
};

export default api;