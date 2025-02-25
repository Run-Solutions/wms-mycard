"use client";

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
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

const Drawer = createDrawerNavigator<DrawerParamList>();

const AppDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: true }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Pedidos" component={PedidosScreen} />
      <Drawer.Screen name="Recibos" component={RecibosScreen} />
      <Drawer.Screen name="Productos" component={ProductosScreen} />
      <Drawer.Screen name="Usuarios" component={UsuariosScreen} />
      <Drawer.Screen name="Ubicaciones" component={UbicacionesScreen} />
      <Drawer.Screen name="Inventario" component={InventarioScreen} />
    </Drawer.Navigator>
  );
};

export default AppDrawer;


