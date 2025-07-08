// src/navigation/AppDrawer.tsx
import React, { useMemo } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './CustomDrawerContent';
import { useModules, ModuleFromApi } from '../api/navigation';
import { MODULE_CONFIG, type ModuleConfig } from './moduleConfig';
import { InternalStack } from './InternalStack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationsScreen from '../screens/NotificationsScreen';

import { stripAccents } from '../utils/stringUtils';

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
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Principal', {
                  screen: 'NotificationsScreen',
                })
              }
              style={{ marginRight: 16 }}
            >
              <Ionicons name="notifications-outline" size={24} color="black" />
            </TouchableOpacity>
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
