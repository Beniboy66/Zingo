import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

const TIPOS = {
  mal_estado: 'Mal Estado',
  ruta_no_respetada: 'Ruta No Respetada',
  acoso: 'Acoso',
  inseguridad: 'Inseguridad',
  tarifa_incorrecta: 'Tarifa Incorrecta',
  otro: 'Otro'
};

export default function ReportesScreen() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const { data: rutasData } = await api.get('/rutas');
      const rutas = rutasData.datos || [];
      const todos = [];
      for (const r of rutas) {
        try {
          const { data } = await api.get(`/reportes/ruta/${r._id}`);
          todos.push(...(data.datos || []).map(rep => ({ ...rep, rutaNombre: r.nombre, rutaColor: r.color })));
        } catch (e) { /* skip */ }
      }
      setReportes(todos);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const votar = async (reporteId, voto) => {
    try {
      await api.post('/votos', { reporteId, voto });
      cargar();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'Error al votar');
    }
  };

  if (cargando) return <View style={estilos.cargando}><ActivityIndicator size="large" color={colores.primario} /></View>;

  return (
    <FlatList
      style={estilos.contenedor}
      data={reportes}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <View style={estilos.vacio}>
          <Ionicons name="document-text-outline" size={48} color={colores.textoSecundario} />
          <Text style={estilos.vacioTexto}>No hay reportes activos</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={estilos.reporteCard}>
          <View style={estilos.reporteHeader}>
            <View style={estilos.tipoBadge}>
              <Text style={estilos.tipoBadgeTexto}>{TIPOS[item.tipo] || item.tipo}</Text>
            </View>
            {item.estado === 'validado' && (
              <View style={estilos.validadoBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={estilos.validadoTexto}>Validado</Text>
              </View>
            )}
          </View>

          <Text style={estilos.rutaNombre}>{item.rutaNombre}</Text>
          <Text style={estilos.descripcion}>{item.descripcion}</Text>

          {/* Barra de votos */}
          <View style={estilos.votosContenedor}>
            <View style={estilos.votosInfo}>
              <View style={estilos.votoLabel}>
                <Ionicons name="arrow-up" size={14} color={colores.exito} />
                <Text style={estilos.votosFavor}>{item.votosFavor}</Text>
              </View>
              <View style={estilos.votoLabel}>
                <Ionicons name="arrow-down" size={14} color={colores.error} />
                <Text style={estilos.votosContra}>{item.votosContra}</Text>
              </View>
            </View>
            <View style={estilos.votosBarra}>
              <View style={[estilos.votosBarraFavor, { flex: item.votosFavor || 1 }]} />
              <View style={[estilos.votosBarraContra, { flex: item.votosContra || 1 }]} />
            </View>
          </View>

          {/* Botones de voto */}
          {item.estado === 'pendiente' && (
            <View style={estilos.votosBotones}>
              <TouchableOpacity style={estilos.botonFavor} onPress={() => votar(item._id, 'favor')} activeOpacity={0.6}>
                <Ionicons name="thumbs-up-outline" size={16} color="#2E7D32" />
                <Text style={estilos.botonFavorTexto}>Es veridico</Text>
              </TouchableOpacity>
              <TouchableOpacity style={estilos.botonContra} onPress={() => votar(item._id, 'contra')} activeOpacity={0.6}>
                <Ionicons name="thumbs-down-outline" size={16} color="#C62828" />
                <Text style={estilos.botonContraTexto}>No es veridico</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vacio: { alignItems: 'center', paddingTop: 60, gap: 12 },
  vacioTexto: { fontSize: 15, color: colores.textoSecundario },
  reporteCard: { backgroundColor: colores.card, borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  reporteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tipoBadge: { backgroundColor: '#E8F0FE', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tipoBadgeTexto: { fontSize: 12, fontWeight: '600', color: colores.primario },
  validadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  validadoTexto: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  rutaNombre: { fontSize: 13, color: colores.primario, fontWeight: '500', marginBottom: 4 },
  descripcion: { fontSize: 14, color: colores.texto, lineHeight: 20 },
  votosContenedor: { marginTop: 12 },
  votosInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  votoLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  votosFavor: { fontSize: 13, fontWeight: '600', color: colores.exito },
  votosContra: { fontSize: 13, fontWeight: '600', color: colores.error },
  votosBarra: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden' },
  votosBarraFavor: { backgroundColor: colores.exito },
  votosBarraContra: { backgroundColor: colores.error },
  votosBotones: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botonFavor: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10 },
  botonContra: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10 },
  botonFavorTexto: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },
  botonContraTexto: { fontSize: 13, fontWeight: '500', color: '#C62828' },
});
