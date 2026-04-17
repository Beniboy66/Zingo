import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colores from '../utils/colores';

const TIPOS = [
  { valor: 'mal_estado', label: 'Mal estado de unidad', icono: 'build-outline' },
  { valor: 'ruta_no_respetada', label: 'Ruta no respetada', icono: 'git-branch-outline' },
  { valor: 'acoso', label: 'Acoso', icono: 'shield-outline' },
  { valor: 'inseguridad', label: 'Inseguridad', icono: 'alert-circle-outline' },
  { valor: 'tarifa_incorrecta', label: 'Tarifa incorrecta', icono: 'cash-outline' },
  { valor: 'otro', label: 'Otro', icono: 'ellipsis-horizontal-circle-outline' },
];

export default function ReportarScreen({ navigation }) {
  const [rutas, setRutas] = useState([]);
  const [rutaId, setRutaId] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get('/rutas').then(({ data }) => setRutas(data.datos || [])).catch(() => {});
  }, []);

  const enviar = async () => {
    if (!rutaId || !tipo || !descripcion) return Alert.alert('Error', 'Completa todos los campos');
    setEnviando(true);
    try {
      await api.post('/reportes', { rutaId, tipo, descripcion });
      Alert.alert('Reporte enviado', 'Tu reporte ha sido registrado. Otros usuarios podran votar si es veridico.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'Error al enviar reporte');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      {/* Selector de ruta */}
      <Text style={estilos.label}>Selecciona la ruta</Text>
      <View style={estilos.chips}>
        {rutas.map((r) => (
          <TouchableOpacity
            key={r._id}
            style={[estilos.chip, rutaId === r._id && estilos.chipActivo]}
            onPress={() => setRutaId(r._id)}
            activeOpacity={0.6}
          >
            <View style={[estilos.chipColor, { backgroundColor: r.color }]} />
            <Text style={[estilos.chipTexto, rutaId === r._id && { color: '#fff' }]}>{r.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tipo de problema */}
      <Text style={estilos.label}>Tipo de problema</Text>
      <View style={estilos.chips}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t.valor}
            style={[estilos.chip, tipo === t.valor && estilos.chipActivo]}
            onPress={() => setTipo(t.valor)}
            activeOpacity={0.6}
          >
            <Ionicons name={t.icono} size={16} color={tipo === t.valor ? '#fff' : colores.textoSecundario} />
            <Text style={[estilos.chipTexto, tipo === t.valor && { color: '#fff' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Descripcion */}
      <Text style={estilos.label}>Descripcion</Text>
      <TextInput
        style={estilos.textarea}
        placeholder="Describe el problema con detalle..."
        placeholderTextColor={colores.textoSecundario}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={estilos.boton} onPress={enviar} disabled={enviando} activeOpacity={0.7}>
        <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={estilos.botonTexto}>{enviando ? 'Enviando...' : 'Enviar Reporte'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  label: { fontSize: 14, fontWeight: '600', color: colores.textoSecundario, marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.card, borderWidth: 1, borderColor: colores.borde, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipColor: { width: 8, height: 8, borderRadius: 4 },
  chipTexto: { fontSize: 13, color: colores.texto, fontWeight: '500' },
  textarea: { backgroundColor: colores.card, borderWidth: 1, borderColor: colores.borde, borderRadius: 10, padding: 14, fontSize: 15, color: colores.texto, minHeight: 120, marginTop: 4 },
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colores.error, borderRadius: 12, padding: 16, marginTop: 28 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
