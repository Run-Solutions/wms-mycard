"use client";

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import AppDrawer from './AppDrawer';
import { AuthContext } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Dashboard" component={AppDrawer} />
        </>
      ) : (
        <Stack.Screen name="Login" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
