import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import colores from '../utils/colores';

const ICONOS = {
  ruta_creada: 'map-outline',
  ruta_actualizada: 'create-outline',
  ruta_eliminada: 'trash-outline',
  reporte_nuevo: 'flag-outline',
  reporte_validado: 'checkmark-circle-outline',
  cuenta_nueva: 'person-add-outline',
  cuenta_aprobada: 'checkmark-circle-outline',
  cuenta_rechazada: 'close-circle-outline',
  aviso_nuevo: 'megaphone-outline',
};

export default function NotificacionesScreen() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/notificaciones');
      const lista = Array.isArray(data.datos) ? data.datos : (data.datos?.notificaciones || []);
      setNotificaciones(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const marcarLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}`);
      setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const navegar = async (item) => {
    if (!item.leida) await marcarLeida(item._id);
    navigation.navigate('Reportes');
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;

  return (
    <FlatList
      style={estilos.contenedor}
      data={notificaciones}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <View style={estilos.vacio}>
          <Ionicons name="notifications-outline" size={48} color={colores.textoSecundario} />
          <Text style={estilos.vacioTexto}>Sin notificaciones</Text>
        </View>
      }
      renderItem={({ item }) => {
        const esAccionable = item.entidadTipo === 'reporte' || item.entidadTipo === 'ruta' || item.entidadTipo === 'cuenta';
        return (
          <TouchableOpacity
            style={[estilos.notifCard, !item.leida && estilos.notifNoLeida]}
            onPress={() => navegar(item)}
            activeOpacity={0.6}
          >
            <View style={[estilos.iconoContenedor, !item.leida && { backgroundColor: '#E8F0FE' }]}>
              <Ionicons name={ICONOS[item.tipo] || 'notifications-outline'} size={20} color={!item.leida ? colores.primario : colores.textoSecundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.notifTitulo}>{item.titulo}</Text>
              <Text style={estilos.notifMensaje}>{item.mensaje}</Text>
              <Text style={estilos.notifFecha}>{new Date(item.createdAt).toLocaleString('es-MX')}</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              {!item.leida && <View style={estilos.punto} />}
              {esAccionable && (
                <Ionicons name="chevron-forward" size={16} color={colores.textoSecundario} />
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vacio: { alignItems: 'center', paddingTop: 60, gap: 12 },
  vacioTexto: { fontSize: 15, color: colores.textoSecundario },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colores.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, opacity: 0.6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  notifNoLeida: { opacity: 1, borderLeftWidth: 3, borderLeftColor: colores.primario },
  iconoContenedor: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.fondo, justifyContent: 'center', alignItems: 'center' },
  notifTitulo: { fontSize: 14, fontWeight: '600', color: colores.texto },
  notifMensaje: { fontSize: 13, color: colores.textoSecundario, marginTop: 2, lineHeight: 18 },
  notifFecha: { fontSize: 11, color: colores.textoSecundario, marginTop: 6 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.primario },
});
