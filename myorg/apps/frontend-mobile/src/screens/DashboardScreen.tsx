import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { MODULE_CONFIG } from '../navigation/moduleConfig';
import { useModules } from '../api/navigation';
import getLocalLogo from '../utils/logoMap';

import ModuleCard from './ModuleCard';
import { useModuleCounts } from './useModuleCounts';

const DashboardScreen: React.FC = () => {
  const modules = useModules(); // [{ id, name, description, imageName, logoName }]
  const navigation = useNavigation();

  const moduleNames = useMemo(() => modules.map(m => m.name), [modules]);
  const { counts } = useModuleCounts(moduleNames);

  return (
    <View style={{ flex: 1 }}>
      {/* Encabezado */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Bienvenido/a a MyCard</Text>
        <Text style={styles.subHeaderText}>Selecciona un módulo para continuar</Text>
      </View>

      {/* Grilla de módulos */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={modules}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => {
          const config = MODULE_CONFIG.find(c => c.name === item.name);
          if (!config) return null;
          return (
            <ModuleCard
              title={item.name}
              imageName={item.imageName}   
              logoName={item.logoName}
              badgeCount={counts[item.name] ?? 0}
              getLocalLogo={getLocalLogo}
              onPress={() => navigation.navigate(config.route as never)}
            />
          );
        }}
      />
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    color: '#000000',
    justifyContent: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  subHeaderText: {
    fontSize: 13,
    color: '#000000',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center', // centra las columnas como en web
  },
});