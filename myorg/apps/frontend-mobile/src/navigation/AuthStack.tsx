// myorg/apps/frontend-mobile/src/navigation/AuthStack.tsx
"use client";

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../app/auth/LoginScreen';
import RegisterScreen from '../app/auth/RegisterScreen';
import RoleSelectionScreen from '../app/auth/RoleSelectionScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RoleSelection: { pendingUser: { username: string; email: string; password: string } };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;

