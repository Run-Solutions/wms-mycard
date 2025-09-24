// src/components/NotificationsBell.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  count?: number;
  onPress?: () => void;
  style?: ViewStyle;
  size?: number;     // tamaño del ícono
  color?: string;    // color del ícono
  max?: number;      // máximo antes de mostrar 99+
};

const NotificationsBell: React.FC<Props> = ({
  count = 0,
  onPress,
  style,
  size = 24,
  color = 'black',
  max = 99,
}) => {
  const display =
    typeof count === 'number' && count > 0 ? (count > max ? `${max}+` : `${count}`) : null;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
      <Ionicons
        name={count > 0 ? 'notifications' : 'notifications-outline'}
        size={size}
        color={color}
      />
      {display && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{display}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { padding: 4 },
  badge: {
    position: 'absolute',
    right: 0,
    top: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default NotificationsBell;