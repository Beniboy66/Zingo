import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, AppState, ScrollView, Dimensions, Vibration, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

const TULANCINGO = { latitude: 20.0833, longitude: -98.3625, latitudeDelta: 0.04, longitudeDelta: 0.04 };
const INTERVALO_REFRESH = 30000;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function distanciaM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapaScreen({ navigation }) {
  const [rutas, setRutas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [resultadosRutas, setResultadosRutas] = useState([]);
  const [resultadosLugares, setResultadosLugares] = useState([]);
  const [marcadorLugar, setMarcadorLugar] = useState(null);
  const [viaje, setViaje] = useState(null);
  const [planificando, setPlanificando] = useState(false);

  // Navegacion activa
  const [navegando, setNavegando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [rutaCaminata, setRutaCaminata] = useState(null);
  const [distanciaAlObjetivo, setDistanciaAlObjetivo] = useState(null);
  const [instruccionActual, setInstruccionActual] = useState('');

  const mapaRef = useRef(null);
  const buscadorTimeout = useRef(null);
  const locationSub = useRef(null);
  const viajeRef = useRef(null);
  const pasoActualRef = useRef(0);

  // Mantener refs sincronizados para el callback de ubicacion
  useEffect(() => { viajeRef.current = viaje; }, [viaje]);
  useEffect(() => { pasoActualRef.current = pasoActual; }, [pasoActual]);

  // ===== CARGA DE RUTAS =====
  const cargarRutas = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas');
      setRutas(data.datos || []);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }, []);

  useFocusEffect(useCallback(() => { cargarRutas(); }, [cargarRutas]));
  useEffect(() => { const i = setInterval(cargarRutas, INTERVALO_REFRESH); return () => clearInterval(i); }, [cargarRutas]);
  useEffect(() => { const s = AppState.addEventListener('change', st => { if (st === 'active') cargarRutas(); }); return () => s.remove(); }, [cargarRutas]);
  useEffect(() => { obtenerUbicacion(); }, []);

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUbicacion(loc.coords);
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      if (geo) setDireccion(`${geo.street || ''} ${geo.streetNumber || ''}, ${geo.subregion || geo.city || ''}`.trim());
    } catch (err) { console.error(err); }
  };

  // ===== BUSQUEDA (via backend) =====
  const buscarLugares = async (texto) => {
    try {
      const { data } = await api.get('/lugares/buscar', {
        params: { texto, lat: TULANCINGO.latitude, lng: TULANCINGO.longitude }
      });
      if (data.exito) {
        setResultadosLugares((data.datos || []).map(l => ({ ...l, tipo: 'lugar' })));
      }
    } catch (err) { console.error('Error buscando lugares:', err); }
  };

  const buscar = (texto) => {
    setBusqueda(texto);
    if (!texto) { setResultadosRutas([]); setResultadosLugares([]); return; }
    setResultadosRutas(rutas.filter(r =>
      r.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(texto.toLowerCase()))
    ));
    if (buscadorTimeout.current) clearTimeout(buscadorTimeout.current);
    buscadorTimeout.current = setTimeout(() => buscarLugares(texto), 400);
  };

  const seleccionarRuta = (ruta) => {
    setBusqueda(''); setResultadosRutas([]); setResultadosLugares([]);
    navigation.navigate('DetalleRuta', { rutaId: ruta._id });
  };

  // ===== PLANIFICACION DE VIAJE (todo via backend) =====
  const seleccionarLugar = async (lugar) => {
    setBusqueda(''); setResultadosRutas([]); setResultadosLugares([]);
    setPlanificando(true);
    try {
      // 1. Obtener coordenadas del lugar via backend
      const { data: detalle } = await api.get('/lugares/detalle', { params: { placeId: lugar.placeId } });
      if (!detalle.exito || !detalle.datos) {
        Alert.alert('Error', 'No se pudo obtener la ubicación del lugar');
        return;
      }
      const { lat, lng, nombre } = detalle.datos;
      setMarcadorLugar({ latitude: lat, longitude: lng, nombre: nombre || lugar.nombre });

      // 2. Planificar viaje via backend
      const origen = ubicacion || { latitude: TULANCINGO.latitude, longitude: TULANCINGO.longitude };
      const { data: respViaje } = await api.get('/viaje/planificar', {
        params: { origenLat: origen.latitude, origenLng: origen.longitude, destinoLat: lat, destinoLng: lng }
      });

      if (respViaje.exito && respViaje.datos) {
        setViaje(respViaje.datos);
        ajustarMapaAlViaje(respViaje.datos, origen, { latitude: lat, longitude: lng });
      } else {
        setViaje(null);
        mapaRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.008, longitudeDelta: 0.008 });
        Alert.alert('Sin ruta', respViaje.mensaje || 'No se encontró una ruta hacia ese destino');
      }
    } catch (err) {
      console.error('Error planificando viaje:', err);
      Alert.alert('Error', 'No se pudo planificar el viaje. Verifica tu conexión.');
    } finally {
      setPlanificando(false);
    }
  };

  const ajustarMapaAlViaje = (v, origen, destino) => {
    const puntos = [
      { latitude: origen.latitude, longitude: origen.longitude },
      { latitude: destino.latitude, longitude: destino.longitude },
    ];
    v.segmentos.forEach(seg => {
      if (seg.paradaSubida?.ubicacion?.coordinates) puntos.push({ latitude: seg.paradaSubida.ubicacion.coordinates[1], longitude: seg.paradaSubida.ubicacion.coordinates[0] });
      if (seg.paradaBajada?.ubicacion?.coordinates) puntos.push({ latitude: seg.paradaBajada.ubicacion.coordinates[1], longitude: seg.paradaBajada.ubicacion.coordinates[0] });
    });
    mapaRef.current?.fitToCoordinates(puntos, { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true });
  };

  const cancelarViaje = () => {
    detenerNavegacion();
    setViaje(null);
    setMarcadorLugar(null);
  };

  // ===== NAVEGACION EN TIEMPO REAL =====
  const obtenerRutaCaminata = async (oLat, oLng, dLat, dLng) => {
    try {
      const { data } = await api.get('/lugares/caminata', {
        params: { origenLat: oLat, origenLng: oLng, destinoLat: dLat, destinoLng: dLng }
      });
      if (data.exito && data.datos?.puntos) {
        return data.datos.puntos.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
      }
    } catch (err) { console.error('Error ruta caminata:', err); }
    return null;
  };

  const comenzarViaje = async () => {
    if (!viaje || !ubicacion) return;

    setNavegando(true);
    setPasoActual(0);
    pasoActualRef.current = 0;

    // Obtener ruta de caminata hasta la primera parada
    const primeraParada = viaje.segmentos[0].paradaSubida.ubicacion.coordinates;
    const rutaWalk = await obtenerRutaCaminata(
      ubicacion.latitude, ubicacion.longitude,
      primeraParada[1], primeraParada[0]
    );
    setRutaCaminata(rutaWalk);

    const dist = distanciaM(ubicacion.latitude, ubicacion.longitude, primeraParada[1], primeraParada[0]);
    setDistanciaAlObjetivo(Math.round(dist));
    setInstruccionActual(`Camina hacia "${viaje.segmentos[0].paradaSubida.nombre}"`);

    mapaRef.current?.animateToRegion({
      latitude: ubicacion.latitude, longitude: ubicacion.longitude,
      latitudeDelta: 0.005, longitudeDelta: 0.005,
    });

    // Tracking GPS en tiempo real
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
      (loc) => actualizarNavegacion(loc.coords)
    );
  };

  const actualizarNavegacion = (coords) => {
    setUbicacion(coords);
    const v = viajeRef.current;
    if (!v) return;

    const pasos = v.pasos;
    const paso = pasos[pasoActualRef.current];
    if (!paso) return;

    if (paso.tipo === 'caminar' && paso.destino) {
      const dist = distanciaM(coords.latitude, coords.longitude, paso.destino[1], paso.destino[0]);
      setDistanciaAlObjetivo(Math.round(dist));
      setInstruccionActual(paso.instruccion);

      if (dist < 30) {
        Vibration.vibrate(500);
        avanzarPaso(coords, pasos);
      }
    } else if (paso.tipo === 'transporte') {
      // Buscar parada de bajada del segmento actual
      const segIndex = pasos.slice(0, pasoActualRef.current).filter(p => p.tipo === 'transporte').length;
      const seg = v.segmentos[segIndex];
      if (seg) {
        const pBajada = seg.paradaBajada.ubicacion.coordinates;
        const dist = distanciaM(coords.latitude, coords.longitude, pBajada[1], pBajada[0]);
        setDistanciaAlObjetivo(Math.round(dist));
        setInstruccionActual(`Baja en "${seg.paradaBajada.nombre}" (${Math.round(dist)}m)`);

        if (dist < 50) {
          Vibration.vibrate([0, 500, 200, 500]);
          avanzarPaso(coords, pasos);
        }
      }
    } else if (paso.tipo === 'transbordo' && paso.destino) {
      const dist = distanciaM(coords.latitude, coords.longitude, paso.destino[1], paso.destino[0]);
      setDistanciaAlObjetivo(Math.round(dist));
      setInstruccionActual(paso.instruccion);

      if (dist < 30) {
        Vibration.vibrate(500);
        avanzarPaso(coords, pasos);
      }
    }
  };

  const avanzarPaso = (coords, pasos) => {
    const siguiente = pasoActualRef.current + 1;
    if (siguiente >= pasos.length) {
      // Llegamos al destino
      setInstruccionActual('Has llegado a tu destino');
      setDistanciaAlObjetivo(0);
      setRutaCaminata(null);
      setPasoActual(siguiente);
      pasoActualRef.current = siguiente;
      Vibration.vibrate([0, 300, 100, 300]);
      return;
    }

    setPasoActual(siguiente);
    pasoActualRef.current = siguiente;
    const nextPaso = pasos[siguiente];

    if (nextPaso.tipo === 'transporte') {
      setInstruccionActual(`Espera "${nextPaso.ruta}" en esta parada`);
      setDistanciaAlObjetivo(null);
      setRutaCaminata(null);
    } else if ((nextPaso.tipo === 'caminar' || nextPaso.tipo === 'transbordo') && nextPaso.destino) {
      setInstruccionActual(nextPaso.instruccion);
      const dist = distanciaM(coords.latitude, coords.longitude, nextPaso.destino[1], nextPaso.destino[0]);
      setDistanciaAlObjetivo(Math.round(dist));
      // Obtener ruta caminata
      obtenerRutaCaminata(coords.latitude, coords.longitude, nextPaso.destino[1], nextPaso.destino[0])
        .then(ruta => setRutaCaminata(ruta));
    }
  };

  const detenerNavegacion = () => {
    setNavegando(false);
    setPasoActual(0);
    pasoActualRef.current = 0;
    setRutaCaminata(null);
    setDistanciaAlObjetivo(null);
    setInstruccionActual('');
    if (locationSub.current) { locationSub.current.remove(); locationSub.current = null; }
  };

  useEffect(() => { return () => { if (locationSub.current) locationSub.current.remove(); }; }, []);

  const irAUbicacion = () => {
    if (ubicacion && mapaRef.current) {
      mapaRef.current.animateToRegion({
        latitude: ubicacion.latitude, longitude: ubicacion.longitude,
        latitudeDelta: navegando ? 0.003 : 0.01, longitudeDelta: navegando ? 0.003 : 0.01
      });
    }
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;

  const pasoActualData = viaje?.pasos?.[pasoActual];

  return (
    <View style={estilos.contenedor}>
      <MapView
        ref={mapaRef}
        style={estilos.mapa}
        initialRegion={TULANCINGO}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={navegando}
      >
        {/* Rutas normales */}
        {!viaje && rutas.map((ruta) => {
          if (!ruta.trazo?.coordinates) return null;
          const coords = ruta.trazo.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          return (
            <Polyline key={ruta._id} coordinates={coords} strokeColor={ruta.color || colores.primario} strokeWidth={3} tappable
              onPress={() => navigation.navigate('DetalleRuta', { rutaId: ruta._id })} />
          );
        })}

        {/* Trazos del viaje */}
        {viaje && viaje.segmentos.map((seg, i) => {
          if (!seg.trazoParcial) return null;
          const coords = seg.trazoParcial.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          return <Polyline key={`seg-${i}`} coordinates={coords} strokeColor={seg.ruta.color || colores.primario} strokeWidth={5} />;
        })}

        {/* Ruta de caminata real */}
        {rutaCaminata && (
          <Polyline coordinates={rutaCaminata} strokeColor={colores.primario} strokeWidth={4} lineDashPattern={[6, 4]} />
        )}

        {/* Linea caminata preview */}
        {viaje && !navegando && !rutaCaminata && ubicacion && viaje.segmentos[0]?.paradaSubida?.ubicacion && (
          <Polyline
            coordinates={[
              { latitude: ubicacion.latitude, longitude: ubicacion.longitude },
              { latitude: viaje.segmentos[0].paradaSubida.ubicacion.coordinates[1], longitude: viaje.segmentos[0].paradaSubida.ubicacion.coordinates[0] }
            ]}
            strokeColor="#8E8E93" strokeWidth={3} lineDashPattern={[8, 6]}
          />
        )}

        {/* Linea caminata al destino preview */}
        {viaje && !navegando && marcadorLugar && (() => {
          const u = viaje.segmentos[viaje.segmentos.length - 1];
          if (!u?.paradaBajada?.ubicacion) return null;
          return (
            <Polyline
              coordinates={[
                { latitude: u.paradaBajada.ubicacion.coordinates[1], longitude: u.paradaBajada.ubicacion.coordinates[0] },
                { latitude: marcadorLugar.latitude, longitude: marcadorLugar.longitude }
              ]}
              strokeColor="#8E8E93" strokeWidth={3} lineDashPattern={[8, 6]}
            />
          );
        })()}

        {/* Linea transbordo */}
        {viaje && viaje.segmentos.length > 1 && (() => {
          const s1 = viaje.segmentos[0], s2 = viaje.segmentos[1];
          if (!s1.paradaBajada?.ubicacion || !s2.paradaSubida?.ubicacion) return null;
          return (
            <Polyline
              coordinates={[
                { latitude: s1.paradaBajada.ubicacion.coordinates[1], longitude: s1.paradaBajada.ubicacion.coordinates[0] },
                { latitude: s2.paradaSubida.ubicacion.coordinates[1], longitude: s2.paradaSubida.ubicacion.coordinates[0] }
              ]}
              strokeColor="#FF9500" strokeWidth={3} lineDashPattern={[8, 6]}
            />
          );
        })()}

        {/* Marcadores paradas */}
        {viaje && viaje.segmentos.map((seg, i) => [
          <Marker key={`sub-${i}`}
            coordinate={{ latitude: seg.paradaSubida.ubicacion.coordinates[1], longitude: seg.paradaSubida.ubicacion.coordinates[0] }}
            title={seg.paradaSubida.nombre} description={`Sube aquí - ${seg.ruta.nombre}`} pinColor="#34C759" />,
          <Marker key={`baj-${i}`}
            coordinate={{ latitude: seg.paradaBajada.ubicacion.coordinates[1], longitude: seg.paradaBajada.ubicacion.coordinates[0] }}
            title={seg.paradaBajada.nombre} description={`Baja aquí - ${seg.ruta.nombre}`} pinColor="#FF3B30" />
        ])}

        {/* Marcador destino */}
        {marcadorLugar && (
          <Marker coordinate={{ latitude: marcadorLugar.latitude, longitude: marcadorLugar.longitude }}
            title={marcadorLugar.nombre} pinColor={colores.primario} />
        )}
      </MapView>

      {/* === BARRA BUSQUEDA === */}
      {!viaje && !navegando && (
        <View style={estilos.barraBusqueda}>
          <View style={estilos.busquedaContenedor}>
            <Ionicons name="search" size={18} color={colores.textoSecundario} style={{ marginRight: 10 }} />
            <TextInput style={estilos.busquedaInput} placeholder="¿A dónde quieres ir?"
              placeholderTextColor={colores.textoSecundario} value={busqueda} onChangeText={buscar} />
          </View>
          {direccion ? (
            <View style={estilos.direccionContenedor}>
              <Ionicons name="navigate" size={12} color={colores.primario} />
              <Text style={estilos.direccion}>{direccion}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Planificando */}
      {planificando && (
        <View style={estilos.planificandoContenedor}>
          <ActivityIndicator size="small" color={colores.primario} />
          <Text style={estilos.planificandoTexto}>Buscando la mejor ruta...</Text>
        </View>
      )}

      {/* Resultados busqueda */}
      {(resultadosRutas.length > 0 || resultadosLugares.length > 0) && (
        <View style={estilos.resultados}>
          <FlatList
            data={[...resultadosRutas.map(r => ({ ...r, tipo: 'ruta', id: r._id })), ...resultadosLugares]}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.tipo === 'ruta') {
                return (
                  <TouchableOpacity style={estilos.resultadoItem} onPress={() => seleccionarRuta(item)}>
                    <View style={estilos.resultadoIcono}><Ionicons name="bus" size={18} color={item.color || colores.primario} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.resultadoNombre}>{item.nombre}</Text>
                      <Text style={estilos.resultadoDesc}>${item.tarifa} · Cada {item.frecuenciaMin} min</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity style={estilos.resultadoItem} onPress={() => seleccionarLugar(item)}>
                  <View style={estilos.resultadoIcono}><Ionicons name="location" size={18} color={colores.error} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.resultadoNombre}>{item.nombre}</Text>
                    <Text style={estilos.resultadoDesc} numberOfLines={1}>{item.descripcion}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* === PANEL NAVEGACION ACTIVA === */}
      {navegando && viaje && (
        <View style={estilos.panelNavegacion}>
          <View style={estilos.navHeader}>
            <View style={[estilos.navIcono, {
              backgroundColor: pasoActualData?.tipo === 'transporte' ? (pasoActualData.color || colores.primario) :
                pasoActualData?.tipo === 'transbordo' ? '#FF9500' : colores.primario
            }]}>
              <Ionicons
                name={pasoActualData?.tipo === 'transporte' ? 'bus' : pasoActualData?.tipo === 'transbordo' ? 'swap-horizontal' : 'walk'}
                size={24} color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.navInstruccion} numberOfLines={2}>{instruccionActual}</Text>
              {distanciaAlObjetivo != null && distanciaAlObjetivo > 0 && (
                <Text style={estilos.navDistancia}>
                  {distanciaAlObjetivo >= 1000 ? `${(distanciaAlObjetivo / 1000).toFixed(1)} km` : `${distanciaAlObjetivo} m`}
                  {(pasoActualData?.tipo === 'caminar' || pasoActualData?.tipo === 'transbordo') && ` · ${Math.ceil(distanciaAlObjetivo / 80)} min caminando`}
                </Text>
              )}
              {distanciaAlObjetivo === 0 && (
                <Text style={[estilos.navDistancia, { color: colores.exito }]}>Has llegado</Text>
              )}
            </View>
          </View>

          <View style={estilos.navProgreso}>
            {viaje.pasos.map((_, i) => (
              <View key={i} style={[estilos.navProgresoDot, i <= pasoActual && { backgroundColor: colores.primario }]} />
            ))}
          </View>

          <View style={estilos.navFooter}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.navDestinoLabel}>Destino</Text>
              <Text style={estilos.navDestinoNombre} numberOfLines={1}>{marcadorLugar?.nombre}</Text>
            </View>
            <TouchableOpacity style={estilos.navCancelar} onPress={cancelarViaje}>
              <Text style={estilos.navCancelarTexto}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* === PANEL PREVIEW VIAJE === */}
      {viaje && !navegando && (
        <View style={estilos.panelViaje}>
          <View style={estilos.panelHeader}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.panelDestino}>{marcadorLugar?.nombre || 'Destino'}</Text>
              <View style={estilos.panelResumen}>
                <View style={estilos.panelChip}>
                  <Ionicons name="time" size={14} color={colores.primario} />
                  <Text style={estilos.panelChipTexto}>{viaje.resumen.tiempoTotalMin} min</Text>
                </View>
                <View style={estilos.panelChip}>
                  <Ionicons name="walk" size={14} color="#8E8E93" />
                  <Text style={estilos.panelChipTexto}>{viaje.resumen.distanciaCaminataM}m</Text>
                </View>
                <View style={estilos.panelChip}>
                  <Ionicons name="cash" size={14} color="#34C759" />
                  <Text style={estilos.panelChipTexto}>${viaje.resumen.tarifaTotal}</Text>
                </View>
                {viaje.resumen.numTransbordos > 0 && (
                  <View style={estilos.panelChip}>
                    <Ionicons name="swap-horizontal" size={14} color="#FF9500" />
                    <Text style={estilos.panelChipTexto}>{viaje.resumen.numTransbordos} transbordo</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={cancelarViaje} style={estilos.panelCerrar}>
              <Ionicons name="close" size={22} color={colores.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.panelPasos} showsVerticalScrollIndicator={false}>
            {viaje.pasos.map((paso, i) => (
              <View key={i} style={estilos.pasoItem}>
                <View style={[estilos.pasoIcono, {
                  backgroundColor: paso.tipo === 'transporte' ? (paso.color || colores.primario) :
                    paso.tipo === 'transbordo' ? '#FF9500' : '#8E8E93'
                }]}>
                  <Ionicons name={paso.tipo === 'transporte' ? 'bus' : paso.tipo === 'transbordo' ? 'swap-horizontal' : 'walk'}
                    size={16} color="#fff" />
                </View>
                {i < viaje.pasos.length - 1 && <View style={estilos.pasoLinea} />}
                <View style={{ flex: 1 }}>
                  <Text style={estilos.pasoInstruccion}>{paso.instruccion}</Text>
                  {paso.tipo === 'transporte' && (
                    <Text style={estilos.pasoDetalle}>Cada {paso.frecuenciaMin} min · ${paso.tarifa}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={estilos.botonComenzar} onPress={comenzarViaje} activeOpacity={0.8}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={estilos.botonComenzarTexto}>Comenzar viaje</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Boton ubicacion */}
      <TouchableOpacity
        style={[estilos.botonUbicacion, (viaje && !navegando) && { bottom: 380 }, navegando && { bottom: 200 }]}
        onPress={irAUbicacion} activeOpacity={0.7}>
        <Ionicons name="navigate" size={20} color={colores.primario} />
      </TouchableOpacity>

      {/* FAB reportar */}
      {!viaje && !navegando && (
        <TouchableOpacity style={estilos.fab} onPress={() => navigation.navigate('Reportar')} activeOpacity={0.7}>
          <Ionicons name="flag" size={20} color="#fff" />
        </TouchableOpacity>
      )}
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
  planificandoContenedor: { position: 'absolute', top: 60, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingVertical: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, zIndex: 10 },
  planificandoTexto: { fontSize: 15, color: colores.texto },
  resultados: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: colores.card, borderRadius: 12, maxHeight: 250, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, zIndex: 10 },
  resultadoItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: colores.borde },
  resultadoIcono: { width: 32, height: 32, borderRadius: 16, backgroundColor: colores.fondo, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resultadoNombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  resultadoDesc: { fontSize: 13, color: colores.textoSecundario, marginTop: 2 },
  panelViaje: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colores.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: SCREEN_HEIGHT * 0.48, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  panelHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colores.borde },
  panelDestino: { fontSize: 18, fontWeight: '700', color: colores.texto, marginBottom: 8 },
  panelResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colores.fondo, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  panelChipTexto: { fontSize: 13, fontWeight: '500', color: colores.texto },
  panelCerrar: { padding: 4, marginLeft: 8 },
  panelPasos: { paddingHorizontal: 20, paddingTop: 12, maxHeight: SCREEN_HEIGHT * 0.2 },
  pasoItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, position: 'relative' },
  pasoIcono: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pasoLinea: { position: 'absolute', left: 14, top: 30, width: 2, height: 16, backgroundColor: colores.borde },
  pasoInstruccion: { fontSize: 14, fontWeight: '500', color: colores.texto, flex: 1, marginTop: 5 },
  pasoDetalle: { fontSize: 12, color: colores.textoSecundario, marginTop: 2 },
  botonComenzar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colores.primario, marginHorizontal: 20, marginTop: 8, marginBottom: 30, paddingVertical: 14, borderRadius: 14 },
  botonComenzarTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
  panelNavegacion: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colores.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12, paddingBottom: 34 },
  navHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 14 },
  navIcono: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  navInstruccion: { fontSize: 16, fontWeight: '700', color: colores.texto },
  navDistancia: { fontSize: 14, color: colores.textoSecundario, marginTop: 4 },
  navProgreso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colores.borde },
  navProgresoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.borde },
  navFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  navDestinoLabel: { fontSize: 12, color: colores.textoSecundario },
  navDestinoNombre: { fontSize: 15, fontWeight: '600', color: colores.texto, marginTop: 2 },
  navCancelar: { backgroundColor: colores.error, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  navCancelarTexto: { fontSize: 14, fontWeight: '600', color: '#fff' },
  botonUbicacion: { position: 'absolute', bottom: 100, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colores.card, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  fab: { position: 'absolute', bottom: 100, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colores.error, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
});
