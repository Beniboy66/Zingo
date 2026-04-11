import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { routesService, stopsService } from '../services/api';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Map: undefined;
  RouteDetail: { route: any };
  Report: undefined;
  Profile: undefined;
  Notifications: undefined;
};

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

interface Props {
  navigation: MapScreenNavigationProp;
}

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para mostrar paradas cercanas');
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Cargar rutas y paradas cercanas
      await Promise.all([
        loadRoutes(),
        loadNearbyStops(latitude, longitude),
      ]);
    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'No se pudo cargar el mapa');
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await routesService.getRoutes();
      if (response.data.exito) {
        setRoutes(response.data.datos);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadNearbyStops = async (lat: number, lng: number) => {
    try {
      const response = await stopsService.getNearbyStops(lat, lng, 10);
      if (response.data.exito) {
        setNearbyStops(response.data.datos);
      }
    } catch (error) {
      console.error('Error loading nearby stops:', error);
    }
  };

  const handleRoutePress = (route: any) => {
    navigation.navigate('RouteDetail', { route });
  };

  const handleReportPress = () => {
    navigation.navigate('Report');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', onPress: logout },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 20.0833,
          longitude: userLocation?.longitude || -98.3625,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Renderizar rutas */}
        {routes.map((route) => (
          <Polyline
            key={route._id}
            coordinates={route.trazo.coordinates.map(([lng, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            strokeColor={route.color}
            strokeWidth={4}
          />
        ))}

        {/* Renderizar paradas cercanas */}
        {nearbyStops.map((stop) => (
          <Marker
            key={stop._id}
            coordinate={{
              latitude: stop.ubicacion.coordinates[1],
              longitude: stop.ubicacion.coordinates[0],
            }}
            title={stop.nombre}
            description={stop.rutaId?.nombre || 'Parada'}
            pinColor="blue"
          />
        ))}
      </MapView>

      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>¿A dónde vas?</Text>
      </View>

      {/* Ubicación actual */}
      {userLocation && (
        <View style={styles.locationBar}>
          <Text style={styles.locationText}>
            Estás en: Calle 21 de Marzo, Col. Centro
          </Text>
        </View>
      )}

      {/* Botones flotantes */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={handleReportPress}>
          <Text style={styles.fabText}>📢</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de navegación inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={handleProfilePress}>
          <Text style={styles.navText}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleNotificationsPress}>
          <Text style={styles.navText}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleLogout}>
          <Text style={styles.navText}>🚪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    fontSize: 18,
    color: '#86868B',
  },
  map: {
    width,
    height,
  },
  searchBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchText: {
    fontSize: 16,
    color: '#86868B',
    textAlign: 'center',
  },
  locationBar: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 20,
    padding: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  fab: {
    backgroundColor: '#FF3B30',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8ED',
  },
  navButton: {
    padding: 10,
  },
  navText: {
    fontSize: 24,
  },
});

export default MapScreen;