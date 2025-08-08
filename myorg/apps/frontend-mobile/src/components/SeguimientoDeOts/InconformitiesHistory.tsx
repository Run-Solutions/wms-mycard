// components/SeguimientoDeOts/InconformitiesHistory.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';

export interface InconformityData {
  id: number;
  comments: string;
  createdAt: string;
  createdBy: string;
  area: string;
}

interface Props {
  inconformities: InconformityData[];
  qualitySectionOpen: boolean;
  toggleQualitySection: () => void;
}

const InconformitiesHistory: React.FC<Props> = ({
  inconformities,
  qualitySectionOpen,
  toggleQualitySection,
}) => {
  if (inconformities.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleQualitySection}>
        <Text style={styles.title}>
          🧾 Historial de Inconformidades{' '}
          <Text style={styles.toggle}>
            ({qualitySectionOpen ? '▼' : '▶'})
          </Text>
        </Text>
      </TouchableOpacity>

      {qualitySectionOpen && (
        <View>
          {inconformities.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.area}>{item.area}</Text>
              <Text style={styles.comment}>{item.comments}</Text>
              <Text style={styles.meta}>
                {item.createdBy} ·{' '}
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  toggle: {
    fontSize: 14,
    color: '#3b82f6',
  },
  item: {
    marginBottom: 14,
  },
  area: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  comment: {
    color: '#374151',
    marginVertical: 4,
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default InconformitiesHistory;
