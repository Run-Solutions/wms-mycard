import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type InfoCardProps = {
  label: string;
  value?: string | number | null; // sigue funcionando como antes
  children?: React.ReactNode; // nuevo: para contenido custom (botones, etc.)
  style?: ViewStyle;
};

const InfoCard = ({ label, value, children, style}: InfoCardProps) => (
  <View style={[styles.cardItem, style]}>
    <Text style={styles.cardLabel}>{label}</Text>
    {children ? (
      <View style={{ marginTop: 8 }}>{children}</View>
    ) : (
      <Text style={styles.cardValue}>{value ?? '—'}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  cardItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default InfoCard;
