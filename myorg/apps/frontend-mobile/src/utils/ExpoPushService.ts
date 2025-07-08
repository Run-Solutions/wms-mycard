import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  console.log("🔹 Entrando a registerForPushNotificationsAsync()");
  let token;

  if (!Device.isDevice) {
    console.warn("⚠️ Debe usar un dispositivo físico");
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log("🔹 Permisos existentes:", existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("🔹 Solicitando permisos...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("🔹 Permisos después de solicitar:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.warn("❌ Permiso de notificaciones denegado");
      return;
    }

    const expoTokenResult = await Notifications.getExpoPushTokenAsync();
    console.log("✅ Token obtenido:", expoTokenResult);
    token = expoTokenResult.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
      console.log("🔹 Canal de notificaciones Android configurado");
    }

    return token;
  } catch (error) {
    console.error("❌ Error al registrar notificaciones:", error);
    return;
  }
}