// components/SeguimientoDeOts/ProgressBarAreas.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { AreaData } from '../../app/protected/seguimientoDeOts/[id]/page';

interface Props {
  areas: AreaData[];
}

const ProgressBarAreas: React.FC<Props> = ({ areas }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const completed = areas.filter((a) => a.status === 'Completado').length;
  const total = areas.length;
  const percentage = Math.round((completed / total) * 100);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progreso General</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          {completed} de {total} áreas completadas
        </Text>
        <Text style={styles.infoText}>{percentage}%</Text>
      </View>
      <View style={styles.progressBackground}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#1f2937',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  progressBackground: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
});

export default ProgressBarAreas;