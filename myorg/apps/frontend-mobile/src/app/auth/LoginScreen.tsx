"use client";

import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, Alert, ImageBackground } from "react-native";
import { TextInput, Button, Text, Title } from "react-native-paper";
import * as LocalAuthentication from "expo-local-authentication";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import { AuthContext } from "../../contexts/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../../api/auth'; 
import { decodeJwtClean } from "../../utils/jwt";


type LoginScreenNavigationProp = NavigationProp<RootStackParamList, "Login">;
interface User {
  username: String,
  role: String,
  role_id: number,
  modules: Array<String>,
}
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setIsAuthenticated, setUser } = useContext(AuthContext);

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
    try {
      if (!username.trim() || !password.trim()) {
        setError("Por favor, ingrese usuario y contraseña");
        return;
      }
      const response = await login(username.trim(), password.trim());
      if (response.status === 500) {
        setError(error || "Error al iniciar sesión");
        return;
      }

      const data = await response.data;
      if (data.token) {
        // Marcar usuario como autenticado y navegar al flujo principal
        await AsyncStorage.setItem('token', data.token);
        const user = decodeJwtClean<User>(data.token)
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setError("No se pudo decodificar el usuario del token");
        }
      } else {
        setError("Respuesta inválida de la API");
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message);
      }else {
        console.error("Error de conexión:", err);
        setError("Error de conexión");
      }
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
      <ImageBackground
        source={require("../../../assets/images/cards.png")}
        resizeMode={"cover" as any}
        style={StyleSheet.absoluteFill}
        blurRadius={15}
      />
      <View style={styles.overlay} />
      <View style={styles.formContainer}>
        <Title style={styles.title}>Iniciar Sesión</Title>
        <TextInput
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          activeOutlineColor="#000"
          style={styles.input}
          theme={{ roundness: 30 }}
        />
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          activeOutlineColor="#000"
          theme={{ roundness: 30 }}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Iniciar Sesión
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate("Register")}
          style={styles.outlinedButton}
          labelStyle={{ color: "#0139a8" }}
        >
          Registrarse
        </Button>
        {biometricSupported && (
          <Text onPress={handleBiometricAuth} style={ {fontSize: 14, textAlign: "center", marginTop: 16, color: "#0139a8"} }>
            Autenticación Biométrica
          </Text>
        )}
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
    justifyContent: "center",
    alignItems: "center",
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
  button: {
    marginVertical: 8,
    backgroundColor: "#0038A8",
    borderRadius: 30,
  },
  outlinedButton: {
    marginVertical: 8,
    backgroundColor: "#fff",
    borderColor: "#0038A8",
    borderWidth: 1.5,
    borderRadius: 30,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
});

export default LoginScreen;