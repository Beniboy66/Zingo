import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

export default function DetalleRutaScreen({ route, navigation }) {
  const { rutaId } = route.params;
  const [ruta, setRuta] = useState(null);
  const [paradas, setParadas] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [esFavorita, setEsFavorita] = useState(false);

  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [estimacion, setEstimacion] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const [rutaRes, paradasRes, avisosRes, favRes] = await Promise.all([
        api.get(`/rutas/${rutaId}`),
        api.get(`/paradas/ruta/${rutaId}`),
        api.get(`/avisos/ruta/${rutaId}`).catch(() => ({ data: { datos: [] } })),
        api.get('/favoritos').catch(() => ({ data: { datos: [] } }))
      ]);
      setRuta(rutaRes.data.datos);
      setParadas(paradasRes.data.datos || []);
      setAvisos(avisosRes.data.datos || []);
      const favs = favRes.data.datos || [];
      setEsFavorita(favs.some(f => (f.rutaId?._id || f.rutaId) === rutaId));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const toggleFavorita = async () => {
    try {
      if (esFavorita) {
        await api.delete(`/favoritos/${rutaId}`);
        setEsFavorita(false);
      } else {
        await api.post('/favoritos', { rutaId });
        setEsFavorita(true);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'Error');
    }
  };

  const estimar = async () => {
    if (!origenId || !destinoId) return Alert.alert('Selecciona origen y destino');
    try {
      const { data } = await api.get(`/estimacion?rutaId=${rutaId}&origenId=${origenId}&destinoId=${destinoId}`);
      setEstimacion(data.datos);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'Error al estimar');
    }
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;
  if (!ruta) return null;

  const coords = ruta.trazo?.coordinates?.map(([lng, lat]) => ({ latitude: lat, longitude: lng })) || [];

  return (
    <ScrollView style={estilos.contenedor}>
      {/* Mapa */}
      <View style={estilos.mapaContenedor}>
        <MapView
          style={estilos.mapa}
          initialRegion={coords.length > 0 ? {
            latitude: coords[0].latitude, longitude: coords[0].longitude,
            latitudeDelta: 0.03, longitudeDelta: 0.03
          } : { latitude: 20.0833, longitude: -98.3625, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
        >
          {coords.length >= 2 && <Polyline coordinates={coords} strokeColor={ruta.color} strokeWidth={4} />}
          {paradas.map((p) => (
            <Marker
              key={p._id}
              coordinate={{ latitude: p.ubicacion.coordinates[1], longitude: p.ubicacion.coordinates[0] }}
              title={p.nombre}
              description={p.referencia}
              pinColor={p.esTerminal ? colores.error : colores.primario}
            />
          ))}
        </MapView>
      </View>

      {/* Info */}
      <View style={estilos.info}>
        <View style={estilos.headerRuta}>
          <View style={[estilos.colorBarra, { backgroundColor: ruta.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={estilos.nombre}>{ruta.nombre}</Text>
            {ruta.descripcion && <Text style={estilos.descripcion}>{ruta.descripcion}</Text>}
          </View>
          <TouchableOpacity onPress={toggleFavorita} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={esFavorita ? 'heart' : 'heart-outline'} size={26} color={esFavorita ? colores.error : colores.textoSecundario} />
          </TouchableOpacity>
        </View>

        <View style={estilos.datosGrid}>
          <View style={estilos.datoItem}>
            <Ionicons name="cash-outline" size={18} color={colores.primario} style={{ marginBottom: 4 }} />
            <Text style={estilos.datoValor}>${ruta.tarifa}</Text>
            <Text style={estilos.datoLabel}>Tarifa</Text>
          </View>
          <View style={estilos.datoItem}>
            <Ionicons name="time-outline" size={18} color={colores.primario} style={{ marginBottom: 4 }} />
            <Text style={estilos.datoValor}>{ruta.horarioInicio} - {ruta.horarioFin}</Text>
            <Text style={estilos.datoLabel}>Horario</Text>
          </View>
          <View style={estilos.datoItem}>
            <Ionicons name="repeat-outline" size={18} color={colores.primario} style={{ marginBottom: 4 }} />
            <Text style={estilos.datoValor}>c/{ruta.frecuenciaMin} min</Text>
            <Text style={estilos.datoLabel}>Frecuencia</Text>
          </View>
          <View style={estilos.datoItem}>
            <Ionicons name="calendar-outline" size={18} color={colores.primario} style={{ marginBottom: 4 }} />
            <Text style={estilos.datoValor}>{ruta.diasOperacion}</Text>
            <Text style={estilos.datoLabel}>Dias</Text>
          </View>
        </View>
      </View>

      {/* Estimacion */}
      <View style={estilos.seccion}>
        <Text style={estilos.seccionTitulo}>Estimar Viaje</Text>
        <View style={estilos.selectores}>
          <View style={estilos.selector}>
            <Text style={estilos.selectorLabel}>Origen</Text>
            {paradas.map(p => (
              <TouchableOpacity key={p._id} onPress={() => setOrigenId(p._id)}
                style={[estilos.paradaChip, origenId === p._id && estilos.paradaChipActivo]}>
                <Text style={[estilos.paradaChipTexto, origenId === p._id && { color: '#fff' }]}>{p.orden}. {p.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={estilos.selector}>
            <Text style={estilos.selectorLabel}>Destino</Text>
            {paradas.map(p => (
              <TouchableOpacity key={p._id} onPress={() => setDestinoId(p._id)}
                style={[estilos.paradaChip, destinoId === p._id && estilos.paradaChipActivo]}>
                <Text style={[estilos.paradaChipTexto, destinoId === p._id && { color: '#fff' }]}>{p.orden}. {p.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity style={estilos.botonEstimar} onPress={estimar} activeOpacity={0.7}>
          <Text style={estilos.botonEstimarTexto}>Calcular</Text>
        </TouchableOpacity>

        {estimacion && (
          <View style={estilos.resultadoEstimacion}>
            <View style={estilos.estimacionGrid}>
              <View style={estilos.estimacionItem}>
                <Ionicons name="resize-outline" size={16} color="#1565C0" />
                <Text style={estilos.estimacionValor}>{estimacion.distancia_km} km</Text>
              </View>
              <View style={estilos.estimacionItem}>
                <Ionicons name="time-outline" size={16} color="#1565C0" />
                <Text style={estilos.estimacionValor}>{estimacion.tiempo_estimado_min} min</Text>
              </View>
              <View style={estilos.estimacionItem}>
                <Ionicons name="cash-outline" size={16} color="#1565C0" />
                <Text style={estilos.estimacionValor}>${estimacion.tarifa}</Text>
              </View>
              <View style={estilos.estimacionItem}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#1565C0" />
                <Text style={estilos.estimacionValor}>{estimacion.paradas_en_recorrido} paradas</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Paradas */}
      <View style={estilos.seccion}>
        <Text style={estilos.seccionTitulo}>Paradas ({paradas.length})</Text>
        {paradas.map((p) => (
          <View key={p._id} style={estilos.paradaItem}>
            <View style={[estilos.paradaNumero, p.esTerminal && { backgroundColor: colores.error }]}>
              <Text style={estilos.paradaNumeroTexto}>{p.orden}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.paradaNombre}>
                {p.nombre}
                <Text style={{ color: p.esTerminal ? colores.error : colores.primario, fontWeight: '600', fontSize: 11 }}>
                  {' '}{p.esTerminal ? 'TERMINAL' : 'PASO'}
                </Text>
              </Text>
              {p.referencia && <Text style={estilos.paradaRef}>{p.referencia}</Text>}
              {(p.techada || p.iluminacion || p.asientos || p.rampa) && (
                <View style={estilos.amenidades}>
                  {p.techada && <View style={estilos.amenidad}><Ionicons name="home-outline" size={11} color={colores.primario} /><Text style={estilos.amenidadTexto}>Techada</Text></View>}
                  {p.iluminacion && <View style={estilos.amenidad}><Ionicons name="bulb-outline" size={11} color={colores.primario} /><Text style={estilos.amenidadTexto}>Iluminada</Text></View>}
                  {p.asientos && <View style={estilos.amenidad}><Ionicons name="person-outline" size={11} color={colores.primario} /><Text style={estilos.amenidadTexto}>Asientos</Text></View>}
                  {p.rampa && <View style={estilos.amenidad}><Ionicons name="accessibility-outline" size={11} color={colores.primario} /><Text style={estilos.amenidadTexto}>Rampa</Text></View>}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Avisos */}
      {avisos.length > 0 && (
        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Avisos</Text>
          {avisos.map((a) => (
            <View key={a._id} style={estilos.avisoItem}>
              <Ionicons name="megaphone-outline" size={16} color="#E65100" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={estilos.avisoTitulo}>{a.titulo}</Text>
                <Text style={estilos.avisoMensaje}>{a.mensaje}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapaContenedor: { height: 250, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  mapa: { flex: 1 },
  info: { padding: 20 },
  headerRuta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  colorBarra: { width: 5, height: 44, borderRadius: 3 },
  nombre: { fontSize: 20, fontWeight: '700', color: colores.texto },
  descripcion: { fontSize: 14, color: colores.textoSecundario, marginTop: 2 },
  datosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  datoItem: { backgroundColor: colores.card, borderRadius: 12, padding: 14, minWidth: '47%', flex: 1, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  datoValor: { fontSize: 15, fontWeight: '700', color: colores.texto },
  datoLabel: { fontSize: 12, color: colores.textoSecundario, marginTop: 2 },
  seccion: { padding: 20, paddingTop: 0 },
  seccionTitulo: { fontSize: 18, fontWeight: '600', color: colores.texto, marginBottom: 12 },
  selectores: { gap: 12 },
  selector: { gap: 6 },
  selectorLabel: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario },
  paradaChip: { backgroundColor: colores.card, borderWidth: 1, borderColor: colores.borde, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  paradaChipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  paradaChipTexto: { fontSize: 13, color: colores.texto },
  botonEstimar: { backgroundColor: colores.primario, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  botonEstimarTexto: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultadoEstimacion: { backgroundColor: '#E8F0FE', borderRadius: 12, padding: 16, marginTop: 12 },
  estimacionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  estimacionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '46%' },
  estimacionValor: { fontSize: 14, color: '#1565C0', fontWeight: '600' },
  paradaItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colores.borde },
  paradaNumero: { width: 28, height: 28, borderRadius: 14, backgroundColor: colores.primario, justifyContent: 'center', alignItems: 'center' },
  paradaNumeroTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },
  paradaNombre: { fontSize: 15, fontWeight: '500', color: colores.texto },
  paradaRef: { fontSize: 13, color: colores.textoSecundario },
  amenidades: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  amenidad: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E8F0FE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  amenidadTexto: { fontSize: 10, color: colores.primario, fontWeight: '500' },
  avisoItem: { flexDirection: 'row', gap: 10, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, marginBottom: 8 },
  avisoTitulo: { fontSize: 14, fontWeight: '600', color: '#E65100' },
  avisoMensaje: { fontSize: 13, color: colores.texto, marginTop: 4, lineHeight: 18 },
});
