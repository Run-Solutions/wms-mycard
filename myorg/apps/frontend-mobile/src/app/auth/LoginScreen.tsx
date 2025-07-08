import React, { useState, useContext } from "react";
import { View, StyleSheet, Alert, ImageBackground } from "react-native";
import { TextInput, Button, Text, Title } from "react-native-paper";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import { AuthContext } from "../../contexts/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { biometricLogin, getBiometricChallenge, login } from '../../api/auth'; 
import { decodeJwtClean } from "../../utils/jwt";
import { registerForPushNotificationsAsync } from "../../utils/ExpoPushService";
import { savePushToken } from "../../api/notifications";


import ReactNativeBiometrics from "react-native-biometrics";
import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

type LoginScreenNavigationProp = NavigationProp<RootStackParamList, "Login">;
interface User {
  sub: number;
  username: string;
  role: string;
  role_id: number;
  modules: string[];
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setIsAuthenticated, setUser } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rnBiometrics = new ReactNativeBiometrics();

  const handleBiometricLogin = async () => {
    try {
      if (!username.trim()) {
        Alert.alert("Error", "Debes ingresar tu nombre de usuario");
        return;
      }

      // Paso 1: pedir challenge al backend
      const challengeResponse = await getBiometricChallenge(username.trim());
      const challenge = challengeResponse.data.challenge;

      if (!challenge) throw new Error("Challenge inválido");

      // Paso 2: verificar huella
      const result = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirma con biometría',
      });

      if (!result.success) {
        Alert.alert("Autenticación cancelada", "No se confirmó la identidad biométrica");
        return;
      }

      // Paso 3: recuperar clave privada del alias
      const alias = `biometric_${username.trim()}`;
      const storedPrivateKey = await SecureStore.getItemAsync(alias);

      if (!storedPrivateKey) {
        Alert.alert("Clave no encontrada", "Este usuario no tiene clave biométrica registrada en este dispositivo.");
        return;
      }

      const secretKey = decodeBase64(storedPrivateKey);
      const messageBytes = new TextEncoder().encode(challenge);
      const signature = nacl.sign.detached(messageBytes, secretKey);
      const signatureBase64 = encodeBase64(signature);

      // Paso 4: enviar firma al backend
      const biometricResponse = await biometricLogin({
        username: username.trim(),
        challenge,
        signature: signatureBase64,
      });

      const { token } = biometricResponse.data;
      if (!token) throw new Error("Token no recibido");

      await AsyncStorage.setItem('token', token);
      const user = decodeJwtClean<User>(token);

      if (user) {
        setUser(user);
        setIsAuthenticated(true);
      } else {
        throw new Error("No se pudo decodificar el usuario");
      }

    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      Alert.alert("Error al iniciar sesión con biometría", msg);
    }
  };

  const handleLogin = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        setError("Por favor, ingrese usuario y contraseña");
        return;
      }
  
      const response = await login(username.trim(), password.trim());
      const data = await response.data;
  
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        const user = decodeJwtClean<User>(data.token);
  
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
  
          // ✅ Registrar notificaciones
          console.log("🔹 Solicitando permisos de notificaciones...");
          const expoToken = await registerForPushNotificationsAsync();
          if (expoToken) {
            console.log("✅ Expo Push Token obtenido:", expoToken);
            await savePushToken(user.sub, expoToken);
            console.log("✅ Token enviado al backend correctamente.");
          } else {
            console.log("⚠️ No se obtuvo un token de notificaciones.");
          }
        } else {
          setError("No se pudo decodificar el usuario del token");
        }
      } else {
        setError("Respuesta inválida de la API");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al iniciar sesión");
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