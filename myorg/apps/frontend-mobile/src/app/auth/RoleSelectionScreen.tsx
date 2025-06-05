// myorg/apps/frontend-mobile/src/app/auth/RoleSelectionScreen.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ImageBackground } from 'react-native';
import { Button, Title, RadioButton, TextInput } from 'react-native-paper';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { getAreas, getRoles, biometricRegister, register } from '../../api/auth';
import ReactNativeBiometrics from 'react-native-biometrics';
import Dropdown from '../../utils/dropdown';
import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';

type RoleSelectionScreenNavigationProp = NavigationProp<RootStackParamList, 'RoleSelection'>;
type RoleSelectionScreenRouteProp = RouteProp<RootStackParamList, 'RoleSelection'>;

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const route = useRoute<RoleSelectionScreenRouteProp>();
  const { pendingUser } = route.params;
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [areas, setAreas] = useState<{ id: number; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      Alert.alert('Error', 'No se pudieron cargar los roles');
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await getAreas();
      setAreas(response.data);
    } catch (error) {
      console.error('Error fetching areas:', error);
      Alert.alert('Error', 'No se pudieron cargar las áreas');
    }
  }
  useEffect(() => {
    fetchRoles();
    if (selectedRole === 2) {
      fetchAreas();
    }
  }, [selectedRole]);

  const handleRegister = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Debes seleccionar un rol');
      return;
    }
    if (selectedRole === 2 && !selectedArea) {
      Alert.alert('Error', 'Debes seleccionar un área');
      return;
    }
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        Alert.alert('Error', 'La biometría no está disponible');
        return;
      }
      console.log('Biometría disponible:', biometryType);
      const promptResult = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirma tu huella para continuar',
      });
      if (!promptResult.success) {
        Alert.alert('Cancelado', 'No se pudo autenticar con huella');
        return;
      }
      // ✅ Validar si ya existe una clave registrada
      const alias = `biometric_${pendingUser.username}`;
      const existingKey = await SecureStore.getItemAsync(alias);
      if (existingKey) {
        Alert.alert('Ya registrado', 'Este usuario ya tiene una clave biométrica en este dispositivo.');
        return;
      }
  
      const { publicKey, secretKey } = nacl.sign.keyPair();
      if (!publicKey || publicKey.length !== 32) {
          Alert.alert('Error', 'No se pudo generar la clave pública correctamente');
          return;
        }if (!publicKey || publicKey.length !== 32) {
        Alert.alert('Error', 'No se pudo generar la clave pública correctamente');
        return;
      }
      // Guardar la clave privada (protegida) en el dispositivo
      await SecureStore.setItemAsync(alias, encodeBase64(secretKey));
 
      console.log('Clave biométrica generada:', publicKey);
  
      const user = {
        ...pendingUser,
        role_id: selectedRole,
        ...(selectedRole === 2 && selectedArea !== null
          ? { areas_operator_id: selectedArea }
          : {}),
      };
      console.log(user);
  
      const response = await register(user);
      const data = response.data;
      
      await biometricRegister({
        username: pendingUser.username,
        publicKey: encodeBase64(publicKey),
      });
  
      if (response.status === 201) {
        Alert.alert('Registro exitoso', 'Ahora puedes iniciar sesión.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.message || 'Error en el registro');
      }
    } catch (error: any) {
      console.error('Error al registrar usuario:', JSON.stringify(error?.response?.data, null, 2));
      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'No se pudo completar el registro'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/images/cards.png")}
        resizeMode={"cover" as any}
        style={StyleSheet.absoluteFill}
        blurRadius={15}
      />
      <View style={styles.overlay} />
        <View style={styles.formContainer}>
          <Title style={styles.title}>Selecciona un Rol</Title>
          <TextInput
            label="Usuario"
            value={pendingUser.username}
            disabled
            mode="outlined"
            activeOutlineColor='#000'
            style={styles.input}
            theme={{ roundness: 30 }}
          />
          <TextInput
            label="Correo Electrónico"
            value={pendingUser.email}
            disabled
            keyboardType="email-address"
            mode="outlined"
            activeOutlineColor='#000'
            style={styles.input}
            theme={{ roundness: 30 }}
          />
          <Dropdown
            label="Selecciona un rol"
            options={roles.map((role) => ({ label: role.name, value: String(role.id) }))}
            selectedValue={String(selectedRole)}
            onSelect={(value) => setSelectedRole(Number(value))}
          />
          {selectedRole == 2 && (
            <Dropdown
              label="Selecciona un área"
              options={areas.map((area) => ({ label: area.name, value: String(area.id) }))}
              selectedValue={String(selectedArea)}
              onSelect={(value) => setSelectedArea(Number(value))}
            />
          )}
          <Button mode="contained" onPress={handleRegister} style={styles.button}>
            Completar Registro
          </Button>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    fontSize: 14,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: 400,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 5,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "bold",
    color: '#0a0d0c',
    fontSize: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 30,
    fontSize: 14,
  },
  radioGroup: {
    marginVertical: 16,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0139a8',
  },

});

export default RoleSelectionScreen;