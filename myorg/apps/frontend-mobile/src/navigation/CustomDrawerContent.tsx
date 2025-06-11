"use client";

import React, { useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const CustomDrawerContent: React.FC<any> = (props) => {
  const { setIsAuthenticated, user } = useContext(AuthContext);
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

      <View style={styles.profileContainer}>
        <DrawerItem
          label={typeof user?.username === "string" ? user.username : "Perfil"}
          onPress={() => console.log('Profile pressed')}
          icon={() => <Image source={require('../../assets/logos/profile.png')} style={{ width: 40, height: 40 }} />}
        />
      </View>
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
  profileContainer: {
    marginTop: 'auto',
    fontSize: 16,
    
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  logoutLabel: {
    color: 'red',
  },
});

export default CustomDrawerContent;