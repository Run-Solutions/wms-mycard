"use client";

import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  ImageBackground 
} from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoleSelection from './RoleSelectionScreen';

// Definimos el tipo específico para la navegación en la pantalla de Registro
type RegisterScreenNavigationProp = NavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

const handleRegisterSubmit = async () => {
  if (password !== confirmPassword) {
    setError("Las contraseñas no coinciden");
    return;
  }

  const pendingUser = { username, email, password };

  try {
    await AsyncStorage.setItem('pendingUser', JSON.stringify(pendingUser));
    navigation.navigate("RoleSelection", { pendingUser });
  } catch (err) {
    console.error('Error al guardar usuario pendiente:', err);
    setError("No se pudo guardar la información");
  }
};

  return (
    <ImageBackground
      source={require('../../../assets/login-background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.formContainer}>
        <Title style={styles.title}>Registro</Title>
        <TextInput
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
        />
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          mode="contained"
          onPress={handleRegisterSubmit}
          style={styles.button}
          disabled={loading}
        >
          Registrarse
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        >
          Volver al Login
        </Button>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    // Sombra para Android
    elevation: 5,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#000', // Título en negro
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginVertical: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default RegisterScreen;

