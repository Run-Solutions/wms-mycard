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
import { validateEmail } from '../../utils/validateEmail';
import { verifyUsername } from '../../api/auth';

// Definimos el tipo específico para la navegación en la pantalla de Registro
type RegisterScreenNavigationProp = NavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      if (!username || !email || !password || !confirmPassword) {
        setError('Todos los campos son obligatorios');
        return;
      }
  
      // Validar caracteres del nombre de usuario
      const safeUsername = username.trim();
      const isValidUsername = /^[a-zA-Z0-9._-]+$/.test(safeUsername);
      if (!isValidUsername) {
        setError('El nombre de usuario solo puede contener letras, números, ".", "-", y "_"');
        return;
      }
  
      const response = await verifyUsername(safeUsername);
      if (response.status === 200) {
        const data = await response.data;
        if (data) {
          setError(`El nombre de usuario "${safeUsername}" ya está en uso`);
          return;
        }
      }
  
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
  
      if (!validateEmail(email)) {
        setError('El correo electrónico no es válido');
        return;
      }
  
      const pendingUser = {
        username: safeUsername,
        email,
        password,
      };
  
      navigation.navigate('RoleSelection', { pendingUser });
      setLoading(true);
    } catch (error) {
      setError('Error al verificar el nombre de usuario');
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/cards.png')}
      style={styles.background}
      resizeMode="cover"
      blurRadius={15}
    >
      <View style={styles.formContainer}>
        <Title style={styles.title}>Registro</Title>
        <View style={styles.input}>
          <TextInput
            label="Usuario"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            activeOutlineColor='#000'
            theme={{ roundness: 30 }}

          />
          <TextInput
            label="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            mode="outlined"
            activeOutlineColor='#000'
            theme={{ roundness: 30 }}
          />
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            activeOutlineColor='#000'
            theme={{ roundness: 30 }}
          />
          <TextInput
            label="Confirmar Contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            activeOutlineColor='#000'
            theme={{ roundness: 30 }}
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          disabled={loading}
        >
          Registrarse
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Login')}
          style={styles.outlinedButton}
          labelStyle={{ color: '#0139a8' }}
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
    gap: 4,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 30,
    fontSize: 14
  },
  button: {
    marginVertical: 8,
    backgroundColor: "#0038A8",
    borderRadius: 30,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
  outlinedButton: {
    marginVertical: 8,
    backgroundColor: "#fff",
    borderColor: "#0038A8",
    borderWidth: 1.5,
    borderRadius: 30,
  },
});

export default RegisterScreen;