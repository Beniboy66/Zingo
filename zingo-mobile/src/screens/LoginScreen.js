import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colores from '../utils/colores';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Completa todos los campos');
    setCargando(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'Error al iniciar sesion');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={estilos.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={estilos.card}>
        <Text style={estilos.logo}>Zingo</Text>
        <Text style={estilos.subtitulo}>Transporte Publico Tulancingo</Text>

        <View style={estilos.inputContenedor}>
          <Ionicons name="mail-outline" size={18} color={colores.textoSecundario} style={estilos.inputIcono} />
          <TextInput
            style={estilos.input}
            placeholder="Correo electronico"
            placeholderTextColor={colores.textoSecundario}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={estilos.inputContenedor}>
          <Ionicons name="lock-closed-outline" size={18} color={colores.textoSecundario} style={estilos.inputIcono} />
          <TextInput
            style={estilos.input}
            placeholder="Contrasena"
            placeholderTextColor={colores.textoSecundario}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!mostrarPassword}
          />
          <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colores.textoSecundario} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={estilos.boton} onPress={handleLogin} disabled={cargando} activeOpacity={0.7}>
          <Text style={estilos.botonTexto}>{cargando ? 'Ingresando...' : 'Iniciar Sesion'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Registro')} style={estilos.enlace}>
          <Text style={estilos.enlaceTexto}>No tienes cuenta? <Text style={{ color: colores.primario, fontWeight: '600' }}>Registrate</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo, padding: 24 },
  card: { backgroundColor: colores.card, borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  logo: { fontSize: 36, fontWeight: '800', color: colores.primario, textAlign: 'center', letterSpacing: -1 },
  subtitulo: { fontSize: 14, color: colores.textoSecundario, textAlign: 'center', marginTop: 4, marginBottom: 32 },
  inputContenedor: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.fondoInput, borderWidth: 1, borderColor: colores.borde, borderRadius: 10, paddingHorizontal: 14, marginBottom: 12 },
  inputIcono: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colores.texto, paddingVertical: 14 },
  boton: { backgroundColor: colores.primario, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  enlace: { marginTop: 20, alignItems: 'center' },
  enlaceTexto: { fontSize: 14, color: colores.textoSecundario },
});
