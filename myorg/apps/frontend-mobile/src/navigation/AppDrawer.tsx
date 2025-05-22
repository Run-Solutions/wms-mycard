"use client";

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashboardScreen from '../screens/DashboardScreen';
import PedidosScreen from '../screens/PedidosScreen';
import RecibosScreen from '../screens/RecibosScreen';
import ProductosScreen from '../screens/ProductosScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import UbicacionesScreen from '../screens/UbicacionesScreen';
import InventarioScreen from '../screens/InventarioScreen';
import CustomDrawerContent from './CustomDrawerContent';

export type DrawerParamList = {
  Dashboard: undefined;
  Pedidos: undefined;
  Recibos: undefined;
  Productos: undefined;
  Usuarios: undefined;
  Ubicaciones: undefined;
  Inventario: undefined;
};
const availableScreens: Record<string, React.FC> = {
  'Ordenes de Trabajo': PedidosScreen,
  'Seguimiento de OTs': RecibosScreen,
  'Finalizacion': ProductosScreen,
  'Permisos': UbicacionesScreen,
  'Usuarios': UsuariosScreen,
};
type Module = {
  id: number;
  name: string;
  description: string;
  imageName: string;
  logoName: string;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const AppDrawer: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('⛔ No se leyó el token');
        }

        const response = await fetch('http://192.168.80.22:3000/dashboard/modules', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          await AsyncStorage.removeItem('token');
          console.log('Token inválido, redirigir a login');
          return;
        }

        if (!response.ok) {
          throw new Error('⛔ Error al obtener módulos');
        }

        const data = await response.json();
        console.log('📦 Módulos:', data.modules);
        setModules(data.modules);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);
  return (
    <Drawer.Navigator
  initialRouteName="Dashboard"
  screenOptions={{ headerShown: true }}
  drawerContent={(props) => <CustomDrawerContent {...props} />}
>
  <Drawer.Screen name="Dashboard" component={DashboardScreen} />
  {modules.map((module) => {
    const ScreenComponent = availableScreens[module.name];
    if (!ScreenComponent) return null;
    return (
      <Drawer.Screen
        key={module.id}
        name={module.name as keyof DrawerParamList}
        component={ScreenComponent}
      />
    );
  })}
</Drawer.Navigator>
  );
};

export default AppDrawer;