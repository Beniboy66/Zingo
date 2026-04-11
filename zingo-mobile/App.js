import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import colores from './src/utils/colores';

// Pantallas Auth
import LoginScreen from './src/screens/LoginScreen';
import RegistroScreen from './src/screens/RegistroScreen';

// Pantallas principales
import MapaScreen from './src/screens/MapaScreen';
import CercanasScreen from './src/screens/CercanasScreen';
import FavoritosScreen from './src/screens/FavoritosScreen';
import ReportesScreen from './src/screens/ReportesScreen';
import PerfilScreen from './src/screens/PerfilScreen';

// Pantallas stack
import DetalleRutaScreen from './src/screens/DetalleRutaScreen';
import ReportarScreen from './src/screens/ReportarScreen';
import NotificacionesScreen from './src/screens/NotificacionesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Mapa: { focused: 'map', unfocused: 'map-outline' },
  Cercanas: { focused: 'location', unfocused: 'location-outline' },
  Favoritos: { focused: 'heart', unfocused: 'heart-outline' },
  Reportes: { focused: 'flag', unfocused: 'flag-outline' },
  Perfil: { focused: 'person', unfocused: 'person-outline' },
};

function TabsNavegacion() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarStyle: {
          backgroundColor: colores.card,
          borderTopColor: colores.borde,
          borderTopWidth: 0.5,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: colores.card, shadowColor: 'transparent', elevation: 0 },
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: colores.texto },
      })}
    >
      <Tab.Screen name="Mapa" component={MapaScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Cercanas" component={CercanasScreen} options={{ title: 'Paradas Cercanas' }} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} options={{ title: 'Mis Favoritas' }} />
      <Tab.Screen name="Reportes" component={ReportesScreen} options={{ title: 'Reportes' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Mi Perfil' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color: colores.primario, letterSpacing: -1 }}>Zingo</Text>
        <Text style={{ fontSize: 14, color: colores.textoSecundario, marginTop: 8 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerBackTitleVisible: false,
        headerTintColor: colores.primario,
        headerStyle: { backgroundColor: colores.card },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: colores.texto },
      }}>
        {!usuario ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registro" component={RegistroScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Inicio" component={TabsNavegacion} options={{ headerShown: false }} />
            <Stack.Screen name="DetalleRuta" component={DetalleRutaScreen} options={{ title: 'Detalle de Ruta' }} />
            <Stack.Screen name="Reportar" component={ReportarScreen} options={{ title: 'Reportar Problema' }} />
            <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
