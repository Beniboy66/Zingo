import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const t = await AsyncStorage.getItem('zingo_token');
        const u = await AsyncStorage.getItem('zingo_usuario');
        if (t && u) {
          setToken(t);
          setUsuario(JSON.parse(u));
        }
      } catch (_) {
        await AsyncStorage.removeItem('zingo_token');
        await AsyncStorage.removeItem('zingo_usuario');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token: nuevoToken, usuario: nuevoUsuario } = data.datos;
    await AsyncStorage.setItem('zingo_token', nuevoToken);
    await AsyncStorage.setItem('zingo_usuario', JSON.stringify(nuevoUsuario));
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
    return nuevoUsuario;
  }, []);

  const registro = useCallback(async (datos) => {
    const { data } = await api.post('/auth/registro', datos);
    const { token: nuevoToken, usuario: nuevoUsuario } = data.datos;
    await AsyncStorage.setItem('zingo_token', nuevoToken);
    await AsyncStorage.setItem('zingo_usuario', JSON.stringify(nuevoUsuario));
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
    return nuevoUsuario;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('zingo_token');
    await AsyncStorage.removeItem('zingo_usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
