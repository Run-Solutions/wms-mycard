"use client";

import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { AuthContext } from '../contexts/AuthContext';

const CustomDrawerContent: React.FC<any> = (props) => {
  const { setIsAuthenticated } = useContext(AuthContext);
  
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <View style={styles.logoutContainer}>
        <DrawerItem
          label="Cerrar sesión"
          onPress={() => {
            // Limpia la sesión y vuelve al flujo de autenticación
            setIsAuthenticated(false);
          }}
          labelStyle={styles.logoutLabel}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  logoutContainer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  logoutLabel: {
    color: 'red',
  },
});

export default CustomDrawerContent;
