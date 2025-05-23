import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MODULE_CONFIG, ModuleFromApi } from '../navigation/moduleConfig';
import DashboardScreen from '../screens/DashboardScreen';
import CustomDrawerContent from './CustomDrawerContent';
import WorkOrderDetailScreen from '../app/protected/seguimientoDeOts/[id]/page';
import { useModules } from '../api/navigation';


const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const AppDrawer: React.FC = () => {
  const modules = useModules();

  // Stack privado que incluye las pantallas que NO quiero en el menú
  const InternalStack = () => (
    <Stack.Navigator initialRouteName="DashboardScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardScreen" component={DashboardScreen}/>
      <Stack.Screen
        name="WorkOrderDetailScreen"
        component={WorkOrderDetailScreen}
        options={({ route }) => ({
          headerShown: false,
          title: `OT #${(route.params as { id: number }).id}`,
        })}
      />
      {modules.map((mod) => {
        const config = MODULE_CONFIG.find(c => c.name === mod.name);
        if (!config) return null;
        return (
          <Stack.Screen options={({ headerShown: false})}
            key={mod.id}
            name={config.route}
            component={config.component}
          />
        );
      })}
    </Stack.Navigator>
  );

  return (
    <Drawer.Navigator
      initialRouteName="Principal"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Principal"
        component={InternalStack}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      {modules.map((mod) => {
        const config = MODULE_CONFIG.find(c => c.name === mod.name);
        if (!config) return null;
        return (
          <Stack.Screen
            key={mod.id}
            name={config.route}
            component={config.component}
          />
        );
      })}
    </Drawer.Navigator>
  );
};

export default AppDrawer;