"use client";

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Title, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableRipple } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  aceptarAuditoria: undefined;
  cerrarOrdenDeTrabajo: undefined;
  // ... otras rutas
};

const modules = [
  { id: 10, name: 'Aceptar Auditoria' },
  { id: 11, name: 'Cerrar Orden de Trabajo' },
];

const toCamelCase = (str: string) =>
  str
    .replace(/\s(.)/g, function(match, group1) {
      return group1.toUpperCase();
    })
    .replace(/\s/g, '')
    .replace(/^(.)/, function(match, group1) {
      return group1.toLowerCase();
    });

const moduleRouteMap: Record<string, keyof RootStackParamList> = {
  aceptarAuditoria: 'aceptarAuditoria',
  cerrarOrdenDeTrabajo: 'cerrarOrdenDeTrabajo',
};

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View>
      {modules.map(module => (
        <TouchableRipple
          key={module.id}
          onPress={() => {
            const routeName = moduleRouteMap[toCamelCase(module.name)];
            if (routeName) {
              navigation.navigate(routeName);
            } else {
              console.warn(`Ruta no definida para módulo ${module.name}`);
            }
          }}
        >
          <View style={{ padding: 16 }}>
            <Text>{module.name}</Text>
          </View>
        </TouchableRipple>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  moduleBox: {
    padding: 16,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
  },
  moduleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    marginVertical: 16,
    color: '#000',
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiBox: {
    width: '45%',
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 16,
    color: '#555',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    marginVertical: 16,
    color: '#000',
  },
  notificationBox: {
    width: '100%',
    padding: 16,
    marginVertical: 8,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#777',
  },
});

export default DashboardScreen;

