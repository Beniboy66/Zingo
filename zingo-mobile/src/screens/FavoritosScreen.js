import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

export default function FavoritosScreen({ navigation }) {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const { data } = await api.get('/favoritos');
      setFavoritos(data.datos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (rutaId) => {
    try {
      await api.delete(`/favoritos/${rutaId}`);
      setFavoritos(prev => prev.filter(f => (f.rutaId?._id || f.rutaId) !== rutaId));
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;

  return (
    <FlatList
      style={estilos.contenedor}
      data={favoritos}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <View style={estilos.vacio}>
          <Ionicons name="heart-outline" size={48} color={colores.textoSecundario} />
          <Text style={estilos.vacioTexto}>No tienes rutas favoritas</Text>
          <Text style={estilos.vacioSub}>Marca rutas como favoritas para verlas aqui</Text>
        </View>
      }
      renderItem={({ item }) => {
        const ruta = item.rutaId;
        if (!ruta || typeof ruta === 'string') return null;
        return (
          <TouchableOpacity
            style={estilos.rutaCard}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('DetalleRuta', { rutaId: ruta._id })}
          >
            <View style={[estilos.colorBarra, { backgroundColor: ruta.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.rutaNombre}>{ruta.nombre}</Text>
              <Text style={estilos.rutaInfo}>${ruta.tarifa} · c/{ruta.frecuenciaMin} min · {ruta.diasOperacion}</Text>
              <Text style={estilos.rutaHorario}>{ruta.horarioInicio} - {ruta.horarioFin}</Text>
            </View>
            <TouchableOpacity onPress={() => eliminar(ruta._id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="heart" size={22} color={colores.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vacio: { alignItems: 'center', paddingTop: 60, gap: 8 },
  vacioTexto: { fontSize: 16, fontWeight: '600', color: colores.texto },
  vacioSub: { fontSize: 14, color: colores.textoSecundario },
  rutaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.card, borderRadius: 12, padding: 16, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  colorBarra: { width: 5, height: 44, borderRadius: 3 },
  rutaNombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  rutaInfo: { fontSize: 13, color: colores.textoSecundario, marginTop: 2 },
  rutaHorario: { fontSize: 12, color: colores.textoSecundario, marginTop: 2 },
});
