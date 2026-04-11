import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RouteDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle de Ruta</Text>
      <Text style={styles.subtitle}>Próximamente...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#86868B',
  },
});

export default RouteDetailScreen;