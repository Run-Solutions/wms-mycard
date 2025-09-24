// src/navigation/AppDrawer.tsx
import React, { useMemo } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './CustomDrawerContent';
import { useModules, ModuleFromApi } from '../api/navigation';
import { MODULE_CONFIG, type ModuleConfig } from './moduleConfig';
import { InternalStack } from './InternalStack';
import NotificationsBell from '../screens/NotificationsBell.tsx';
import { stripAccents } from '../utils/stringUtils';
import { useUnreadNotificationsCount } from '../screens/useUnreadNotificationsCount';

const Drawer = createDrawerNavigator();

const AppDrawer: React.FC = () => {
  const rawModules = useModules();
  const modules: ModuleFromApi[] = useMemo(
    () => (Array.isArray(rawModules) ? rawModules : []),
    [rawModules]
  );

  const drawerScreens = useMemo(() => {
    return MODULE_CONFIG.filter((cfg: ModuleConfig) =>
      modules.some((mod) => stripAccents(mod.name) === stripAccents(cfg.name))
    ).map((cfg: ModuleConfig) => (
      <Drawer.Screen
        key={cfg.route}
        name={cfg.route}
        component={cfg.component}
      />
    ));
  }, [modules]);

  // ← trae el conteo (sin polling; si quieres, pasa por ej. pollMs=60000)
  const { count } = useUnreadNotificationsCount();

  return (
    <Drawer.Navigator
      initialRouteName="Principal"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Principal"
        options={({ navigation }) => ({
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          title: 'Inicio',
          headerRight: () => (
            <NotificationsBell
              count={count}
              onPress={() =>
                navigation.navigate('Principal', {
                  screen: 'NotificationsScreen',
                })
              }
              style={{ marginRight: 16 }}
            />
          ),
        })}
      >
        {() => <InternalStack modules={modules} />}
      </Drawer.Screen>

      {drawerScreens}
    </Drawer.Navigator>
  );
};

export default AppDrawer;