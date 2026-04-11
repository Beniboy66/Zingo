import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

const TULANCINGO = { latitude: 20.0833, longitude: -98.3625, latitudeDelta: 0.04, longitudeDelta: 0.04 };

export default function MapaScreen({ navigation }) {
  const [rutas, setRutas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [resultados, setResultados] = useState([]);
  const mapaRef = useRef(null);

  useEffect(() => {
    cargarRutas();
    obtenerUbicacion();
  }, []);

  const cargarRutas = async () => {
    try {
      const { data } = await api.get('/rutas');
      setRutas(data.datos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUbicacion(loc.coords);

      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      if (geo) {
        setDireccion(`${geo.street || ''} ${geo.streetNumber || ''}, ${geo.subregion || geo.city || ''}`.trim());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const buscar = (texto) => {
    setBusqueda(texto);
    if (!texto) {
      setResultados([]);
      return;
    }
    const filtradas = rutas.filter(r =>
      r.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(texto.toLowerCase()))
    );
    setResultados(filtradas);
  };

  const seleccionarRuta = (ruta) => {
    setBusqueda('');
    setResultados([]);
    navigation.navigate('DetalleRuta', { rutaId: ruta._id });
  };

  const irAUbicacion = () => {
    if (ubicacion && mapaRef.current) {
      mapaRef.current.animateToRegion({
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;

  return (
    <View style={estilos.contenedor}>
      <MapView
        ref={mapaRef}
        style={estilos.mapa}
        initialRegion={TULANCINGO}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {rutas.map((ruta) => {
          if (!ruta.trazo?.coordinates) return null;
          const coords = ruta.trazo.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          return (
            <Polyline
              key={ruta._id}
              coordinates={coords}
              strokeColor={ruta.color || colores.primario}
              strokeWidth={4}
              tappable
              onPress={() => navigation.navigate('DetalleRuta', { rutaId: ruta._id })}
            />
          );
        })}
      </MapView>

      {/* Barra de busqueda */}
      <View style={estilos.barraBusqueda}>
        <View style={estilos.busquedaContenedor}>
          <Ionicons name="search" size={18} color={colores.textoSecundario} style={{ marginRight: 10 }} />
          <TextInput
            style={estilos.busquedaInput}
            placeholder="Buscar ruta o destino"
            placeholderTextColor={colores.textoSecundario}
            value={busqueda}
            onChangeText={buscar}
          />
        </View>
        {direccion ? (
          <View style={estilos.direccionContenedor}>
            <Ionicons name="navigate" size={12} color={colores.primario} />
            <Text style={estilos.direccion}>{direccion}</Text>
          </View>
        ) : null}
      </View>

      {/* Resultados de busqueda */}
      {resultados.length > 0 && (
        <View style={estilos.resultados}>
          <FlatList
            data={resultados}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity style={estilos.resultadoItem} onPress={() => seleccionarRuta(item)}>
                <View style={[estilos.resultadoColor, { backgroundColor: item.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.resultadoNombre}>{item.nombre}</Text>
                  <Text style={estilos.resultadoDesc}>${item.tarifa} · Cada {item.frecuenciaMin} min</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Boton mi ubicacion */}
      <TouchableOpacity style={estilos.botonUbicacion} onPress={irAUbicacion} activeOpacity={0.7}>
        <Ionicons name="navigate" size={20} color={colores.primario} />
      </TouchableOpacity>

      {/* FAB reportar */}
      <TouchableOpacity style={estilos.fab} onPress={() => navigation.navigate('Reportar')} activeOpacity={0.7}>
        <Ionicons name="flag" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  mapa: { flex: 1 },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo },
  barraBusqueda: { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 10 },
  busquedaContenedor: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  busquedaInput: { flex: 1, fontSize: 16, color: colores.texto, paddingVertical: 12 },
  direccionContenedor: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4, gap: 4 },
  direccion: { fontSize: 12, color: colores.textoSecundario },
  resultados: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: colores.card, borderRadius: 12, maxHeight: 250, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, zIndex: 10 },
  resultadoItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: colores.borde },
  resultadoColor: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  resultadoNombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  resultadoDesc: { fontSize: 13, color: colores.textoSecundario, marginTop: 2 },
  botonUbicacion: { position: 'absolute', bottom: 100, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colores.card, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  fab: { position: 'absolute', bottom: 100, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colores.error, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
});
