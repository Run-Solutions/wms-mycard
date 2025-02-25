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
import { RootStackParamList } from '../navigation/types';

// Definimos el tipo específico para la navegación en la pantalla de Registro
type RegisterScreenNavigationProp = NavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validamos que todos los campos estén completos
    if (!username || !email || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      // Realizamos la llamada a la API de registro.
      // Si trabajas en un dispositivo, reemplaza "localhost" con la IP adecuada.
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrarse');
      }

      const data = await response.json();
      Alert.alert('Registro exitoso', 'Ahora puedes iniciar sesión.');
      navigation.navigate('Login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/login-background.jpg')}
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
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Auth')}
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


