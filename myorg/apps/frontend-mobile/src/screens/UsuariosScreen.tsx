"use client";// packages/frontend-mobile/src/screens/UsuariosScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UsuariosScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>UsuariosScreen</Text>
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

export default UsuariosScreen;