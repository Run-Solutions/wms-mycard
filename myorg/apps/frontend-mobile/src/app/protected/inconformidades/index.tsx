"use client";// packages/frontend-mobile/src/screens/ProductosScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const inconformidades: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>ProductosScreen</Text>
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

export default inconformidades;
