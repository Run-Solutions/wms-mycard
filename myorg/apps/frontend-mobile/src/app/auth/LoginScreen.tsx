"use client";

import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Video } from "expo-av";
import { TextInput, Button, Text, Title } from "react-native-paper";
import * as LocalAuthentication from "expo-local-authentication";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import { AuthContext } from "../../contexts/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = NavigationProp<RootStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setIsAuthenticated } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricSupported(compatible);
    })();
  }, []);

  const handleLogin = async () => {
    console.log("Iniciando login con:", username, password);
    try {
      const response = await fetch("http://192.168.80.22:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Error al iniciar sesión");
        return;
      }
      
      const data = await response.json();
      if (data.token) {
        // Marcar usuario como autenticado y navegar al flujo principal
        await AsyncStorage.setItem('token', data.token);
        setIsAuthenticated(true);
      } else {
        setError("Respuesta inválida de la API");
      }
    } catch (err: any) {
      setError("Error de conexión");
    }
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Autenticación biométrica",
    });
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      Alert.alert("Autenticación fallida");
    }
  };

  return (
    <View style={styles.container}>
      <Video
        source={require("../../../assets/login-background.mp4")}
        rate={1.0}
        volume={1.0}
        isMuted
        resizeMode={"cover" as any}
        shouldPlay
        isLooping
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />
      <View style={styles.formContainer}>
        <Title style={styles.title}>Iniciar Sesión</Title>
        <TextInput
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Iniciar Sesión
        </Button>
        {biometricSupported && (
          <Button mode="outlined" onPress={handleBiometricAuth} style={styles.button}>
            Autenticación Biométrica
          </Button>
        )}
        <Button onPress={() => navigation.navigate("Register")} style={styles.button}>
          Registrarse
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  formContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -200 }, { translateY: -150 }],
    backgroundColor: "rgba(255, 255, 255, 0.95)",
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
    color: "#000",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  button: {
    marginVertical: 8,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
});

export default LoginScreen;






