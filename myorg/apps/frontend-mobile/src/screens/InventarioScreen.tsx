"use client";// packages/frontend-mobile/src/screens/InventarioScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InventarioScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>InventarioScreen</Text>
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

export default InventarioScreen;