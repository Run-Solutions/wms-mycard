"use client";

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import AppDrawer from './AppDrawer';
import { AuthContext } from '../contexts/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppDrawer} />
      ) : (
        // Forzamos el tipo para "Auth" si es necesario:
        <Stack.Screen name={"Auth" as keyof RootStackParamList} component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
