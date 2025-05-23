import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MODULE_CONFIG, ModuleFromApi } from '../navigation/moduleConfig';
import getLocalLogo from '../utils/logoMap';
import { useModules } from '../api/navigation';

const DashboardScreen: React.FC = () => {
  const modules = useModules();
  const navigation = useNavigation();
  
  return (
    <View style={{ flex: 1 }}>
      {/* Encabezado */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Bienvenido/a a MyCard</Text>
        <Text style={styles.subHeaderText}>Seleccioná un módulo para continuar</Text>
      </View>
  
      {/* Lista de módulos */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {modules.map((mod) => {
          const config = MODULE_CONFIG.find(c => c.name === mod.name);
          if (!config) return null;
  
          return (
            <Pressable
              key={mod.id}
              onPress={() => navigation.navigate(config.route as never)}
              style={({ pressed }) => [
                styles.moduleCard,
                pressed && styles.pressedCard
              ]}
            >
              <View style={styles.cardContent}>
                <Image
                  source={getLocalLogo(mod.logoName)}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.textContainer}>
                  <Text style={styles.moduleTitle}>{mod.name}</Text>
                  <Text style={styles.moduleDescription}>{mod.description}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 15,
    backgroundColor: '#f4f4f4',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  moduleCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pressedCard: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 16,
    borderRadius: 8,
  },
  textContainer: {
    flexShrink: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
  },
});