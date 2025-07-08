// src/navigation/InternalStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ModuleFromApi } from '../api/navigation';
import { MODULE_CONFIG, type ModuleConfig } from './moduleConfig';

import DashboardScreen from '../screens/DashboardScreen';
import WorkOrderDetailScreen from '../app/protected/seguimientoDeOts/[id]/page';
import AceptarProductoAuxScreen from '../app/protected/aceptarProducto/[id]/page';
import AceptarAuditoriaAuxScreen from '../app/protected/aceptarAuditoria/[id]/page';
import LiberarProductoAuxScreen from '../app/protected/liberarProducto/[id]/page';
import CerrarOrdenDeTrabajoAuxScreen from '../app/protected/cerrarOrdenDeTrabajo/[id]/page';
import RecepcionCQMAuxScreen from '../app/protected/recepcionCqm/[id]/page';
import InconformidadesAuxScreen from '../app/protected/inconformidades/[id]/page';
import NotificationsScreen from '../screens/NotificationsScreen';

// Importa stripAccents
import { stripAccents } from '../utils/stringUtils';

const Stack = createNativeStackNavigator();

interface InternalStackProps {
  modules: ModuleFromApi[];
}

export const InternalStack: React.FC<InternalStackProps> = ({ modules }) => {
  // Buscamos las configuraciones cuyos names coincidan (sin tildes ni mayúsculas)
  const dynamicScreens = modules
    .map((mod) =>
      MODULE_CONFIG.find(
        (cfg) => stripAccents(mod.name) === stripAccents(cfg.name)
      )
    )
    .filter((cfg): cfg is ModuleConfig => cfg !== undefined);

  return (
    <Stack.Navigator
      initialRouteName="DashboardScreen"
      screenOptions={{ headerShown: false }}
    >
      {/** Rutas fijas **/}
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen
        name="WorkOrderDetailScreen"
        component={WorkOrderDetailScreen}
        options={({ route }) => ({
          title: `OT #${(route.params as { id: number }).id}`,
        })}
      />
      <Stack.Screen
        name="AceptarProductoAuxScreen"
        component={AceptarProductoAuxScreen}
        options={({ route }) => ({
          title: `Flujo #${(route.params as { flowId: string }).flowId}`,
        })}
      />
      <Stack.Screen
        name="AceptarAuditoriaAuxScreen"
        component={AceptarAuditoriaAuxScreen}
        options={({ route }) => ({
          title: `Flujo #${(route.params as { flowId: string }).flowId}`,
        })}
      />
      <Stack.Screen
        name="LiberarProductoAuxScreen"
        component={LiberarProductoAuxScreen}
        options={({ route }) => ({
          title: `OT #${(route.params as { id: number }).id}`,
        })}
      />
      <Stack.Screen
        name="CerrarOrdenDeTrabajoAuxScreen"
        component={CerrarOrdenDeTrabajoAuxScreen}
        options={({ route }) => ({
          title: `OT #${(route.params as { id: number }).id}`,
        })}
      />
      <Stack.Screen
        name="RecepcionCQMAuxScreen"
        component={RecepcionCQMAuxScreen}
        options={({ route }) => ({
          title: `OT #${(route.params as { id: number }).id}`,
        })}
      />
      <Stack.Screen
        name="InconformidadesAuxScreen"
        component={InconformidadesAuxScreen}
        options={({ route }) => ({
          title: `OT #${(route.params as { id: number }).id}`,
        })}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          title: 'Notificacioddes',
        }}
      />

      {/** Rutas dinámicas **/}
      {dynamicScreens.map((cfg) => (
        <Stack.Screen
          key={cfg.route}
          name={cfg.route}
          component={cfg.component}
        />
      ))}
    </Stack.Navigator>
  );
};
