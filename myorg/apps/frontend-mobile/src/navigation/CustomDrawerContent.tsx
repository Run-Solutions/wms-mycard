"use client";

import React, { useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const CustomDrawerContent: React.FC<any> = (props) => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const handleGoToDashboard = () => {
    props.navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Principal',
          state: {
            index: 0,
            routes: [{ name: 'DashboardScreen' }],
          },
        },
      ],
    });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <TouchableOpacity onPress={handleGoToDashboard} style={styles.principalButton}>
        <Text style={styles.principalLabel}>🏠 Principal</Text>
      </TouchableOpacity>

      <DrawerItemList {...props} />

      <View style={styles.logoutContainer}>
        <DrawerItem
          label="Cerrar sesión"
          onPress={() => setIsAuthenticated(false)}
          labelStyle={styles.logoutLabel}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  principalButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  principalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
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