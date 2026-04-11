import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colores from '../utils/colores';

export default function PerfilScreen({ navigation }) {
  const { usuario, logout } = useAuth();

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.header}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={estilos.nombre}>{usuario?.nombre}</Text>
        <Text style={estilos.email}>{usuario?.email}</Text>
      </View>

      <View style={estilos.seccion}>
        <TouchableOpacity style={estilos.campo} onPress={() => navigation.navigate('Notificaciones')}>
          <View style={estilos.campoIzq}>
            <Ionicons name="notifications-outline" size={20} color={colores.primario} />
            <Text style={estilos.campoLabel}>Notificaciones</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
        </TouchableOpacity>

        <View style={estilos.campo}>
          <View style={estilos.campoIzq}>
            <Ionicons name="person-outline" size={20} color={colores.primario} />
            <Text style={estilos.campoLabel}>Nombre</Text>
          </View>
          <Text style={estilos.campoValor}>{usuario?.nombre}</Text>
        </View>

        <View style={estilos.campo}>
          <View style={estilos.campoIzq}>
            <Ionicons name="mail-outline" size={20} color={colores.primario} />
            <Text style={estilos.campoLabel}>Email</Text>
          </View>
          <Text style={estilos.campoValor}>{usuario?.email}</Text>
        </View>

        <View style={[estilos.campo, { borderBottomWidth: 0 }]}>
          <View style={estilos.campoIzq}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colores.primario} />
            <Text style={estilos.campoLabel}>Rol</Text>
          </View>
          <Text style={estilos.campoValor}>{usuario?.rol === 'usuario' ? 'Pasajero' : usuario?.rol}</Text>
        </View>
      </View>

      <TouchableOpacity style={estilos.botonLogout} onPress={logout} activeOpacity={0.6}>
        <Ionicons name="log-out-outline" size={20} color={colores.error} />
        <Text style={estilos.botonLogoutTexto}>Cerrar Sesion</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo, padding: 20 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colores.primario, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTexto: { fontSize: 32, fontWeight: '700', color: '#fff' },
  nombre: { fontSize: 22, fontWeight: '700', color: colores.texto },
  email: { fontSize: 14, color: colores.textoSecundario, marginTop: 4 },
  seccion: { backgroundColor: colores.card, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  campo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: colores.borde },
  campoIzq: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  campoLabel: { fontSize: 15, color: colores.texto },
  campoValor: { fontSize: 15, color: colores.textoSecundario },
  botonLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colores.card, borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: colores.error },
  botonLogoutTexto: { color: colores.error, fontSize: 16, fontWeight: '600' },
});
