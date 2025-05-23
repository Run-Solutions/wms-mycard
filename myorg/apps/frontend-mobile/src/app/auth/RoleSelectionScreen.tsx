"use client";

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Title, RadioButton } from 'react-native-paper';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { getRoles, register } from '../../api/auth'; // 👈 importar funciones

type RoleSelectionScreenNavigationProp = NavigationProp<RootStackParamList, 'RoleSelection'>;
type RoleSelectionScreenRouteProp = RouteProp<RootStackParamList, 'RoleSelection'>;

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const route = useRoute<RoleSelectionScreenRouteProp>();
  const { pendingUser } = route.params;

  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  useEffect(() => {
    getRoles()
      .then((res) => setRoles(res.data))
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los roles'));
  }, []);

  const handleFinalRegister = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Debes seleccionar un rol');
      return;
    }
    try {
      const response = await register({ ...pendingUser, role_id: selectedRole });
      Alert.alert('Registro exitoso', 'Ahora puedes iniciar sesión.');
      navigation.navigate('Login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error en el registro';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <Title>Selecciona un Rol</Title>
      <RadioButton.Group onValueChange={(value) => setSelectedRole(Number(value))} value={String(selectedRole)}>
        {roles.map((role) => (
          <RadioButton.Item key={role.id} label={role.name} value={String(role.id)} />
        ))}
      </RadioButton.Group>
      <Button mode="contained" onPress={handleFinalRegister} style={styles.button}>
        Completar Registro
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    marginTop: 16,
  },
});

export default RoleSelectionScreen;