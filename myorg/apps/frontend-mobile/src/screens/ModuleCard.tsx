import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';

type ModuleCardProps = {
  title: string;
  imageName?: string;     // e.g. "recepcion.jpg" (assets locales opcionales)
  logoName: string;       // mapea a tu getLocalLogo
  badgeCount?: number;
  onPress?: () => void;
  getLocalLogo: (logoName: string) => any; // tu util existente
};

const isErrorTitle = (t: string) => {
  const s = t.trim().toLowerCase();
  return s === 'inconformidades' || s === 'rechazos';
};

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  imageName,
  logoName,
  badgeCount = 0,
  onPress,
  getLocalLogo,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current; // parallax leve

  const startPressAnim = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -4,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const endPressAnim = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Si tienes las imágenes como assets locales, cámbialas a require(...)
  // o arma tu propio mapper como con los logos.
  const backgroundSource = imageName
    ? { uri: Image.resolveAssetSource?.({ uri: imageName })?.uri ?? '' }
    : undefined;

  const error = isErrorTitle(title);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={startPressAnim}
      onPressOut={endPressAnim}
      style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
      android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: true }}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <ImageBackground
          source={backgroundSource}
          style={styles.bg}
          imageStyle={styles.bgImage}
        >
          {/* Overlay gradiente (si usas react-native-linear-gradient, reemplaza este View por <LinearGradient .../>) */}
          <View
            style={[
              styles.overlay,
              {
                // Gradiente simple con opacidades (fallback)
                backgroundColor: error
                  ? 'rgba(211,47,47,0.85)'
                  : 'rgba(63,81,181,0.85)', // error.primary / primary aprox.
              },
            ]}
          />

          <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
            <View style={styles.iconBox}>
              <Image
                source={getLocalLogo(logoName)}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text numberOfLines={3} style={styles.title}>
              {title}
            </Text>

            {badgeCount > 0 && (
              <View
                style={[
                  styles.badge,
                  error ? styles.badgeError : styles.badgeOk,
                ]}
              >
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
};

export default ModuleCard;

const CARD_W = 168;  // 2 columnas cómodas
const CARD_H = 150;

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  wrapperPressed: {
    opacity: 0.98,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#121212',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bg: { flex: 1 },
  bgImage: {
    transform: [{ scale: 1.06 }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  badge: {
    marginTop: 8,
    minWidth: 28,
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOk: {
    backgroundColor: '#7C4DFF', // secondary aprox.
  },
  badgeError: {
    backgroundColor: '#D32F2F', // error
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});