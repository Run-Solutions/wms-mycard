"use client";// packages/frontend-mobile/src/screens/PedidosScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PedidosScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>PedidosScreen</Text>
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

export default PedidosScreen;
