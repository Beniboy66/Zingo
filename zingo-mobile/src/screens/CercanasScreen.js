import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

export default function CercanasScreen({ navigation }) {
  const [paradas, setParadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    buscarCercanas();
  }, []);

  const buscarCercanas = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos tu ubicacion para encontrar paradas cercanas');
        setCargando(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        setDireccion(`${geo.street || ''} ${geo.streetNumber || ''}, ${geo.subregion || geo.city || ''}`.trim());
      }

      const { data } = await api.get(`/cercana?lat=${latitude}&lng=${longitude}&limite=10`);
      setParadas(data.datos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;

  return (
    <View style={estilos.contenedor}>
      {direccion ? (
        <View style={estilos.ubicacionBanner}>
          <Ionicons name="navigate" size={14} color={colores.primario} />
          <Text style={estilos.ubicacionTexto}>{direccion}</Text>
        </View>
      ) : null}

      <FlatList
        data={paradas}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Ionicons name="bus-outline" size={48} color={colores.textoSecundario} />
            <Text style={estilos.vacioTexto}>No se encontraron paradas cercanas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={estilos.paradaCard}
            activeOpacity={0.6}
            onPress={() => {
              if (item.rutaId) {
                const rutaId = typeof item.rutaId === 'object' ? item.rutaId._id : item.rutaId;
                navigation.navigate('DetalleRuta', { rutaId });
              }
            }}
          >
            <View style={estilos.paradaIcono}>
              <Ionicons name="location" size={20} color={colores.primario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.paradaNombre}>{item.nombre}</Text>
              {item.rutaId?.nombre && (
                <Text style={estilos.paradaRuta}>{item.rutaId.nombre}</Text>
              )}
              {item.referencia && (
                <Text style={estilos.paradaRef}>{item.referencia}</Text>
              )}
            </View>
            {item.distancia && (
              <View style={estilos.distanciaBadge}>
                <Text style={estilos.distanciaTexto}>{item.distancia < 1 ? `${Math.round(item.distancia * 1000)}m` : `${item.distancia.toFixed(1)}km`}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ubicacionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F0FE', paddingHorizontal: 16, paddingVertical: 10 },
  ubicacionTexto: { fontSize: 13, color: colores.primario, fontWeight: '500' },
  paradaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  paradaIcono: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F0FE', justifyContent: 'center', alignItems: 'center' },
  paradaNombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  paradaRuta: { fontSize: 13, color: colores.primario, marginTop: 2 },
  paradaRef: { fontSize: 12, color: colores.textoSecundario, marginTop: 2 },
  distanciaBadge: { backgroundColor: colores.fondo, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  distanciaTexto: { fontSize: 12, fontWeight: '600', color: colores.primario },
  vacio: { alignItems: 'center', paddingTop: 60, gap: 12 },
  vacioTexto: { fontSize: 15, color: colores.textoSecundario },
});
