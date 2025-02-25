"use client";// packages/frontend-mobile/src/screens/UbicacionesScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UbicacionesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>UbicacionesScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UbicacionesScreen;