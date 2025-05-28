// myorg/apps/frontend-mobile/src/components/LiberarProducto/WorkOrderList.tsx
"use client";

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

type Navigation = NavigationProp<RootStackParamList, 'LiberarProductoAuxScreen'>;
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: {
    username: string;
  };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
}

interface Props {
  orders: WorkOrder[];
  title?: string; 
  onSelectOrder?: (id: number) => void;
}

const WorkOrderList: React.FC<Props> = ({ orders, onSelectOrder }) => {
  const navigation = useNavigation<any>();
  const renderItem = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity
    onPress={() =>
      navigation.navigate('Principal', {
        screen: 'LiberarProductoAuxScreen',
        params: { id: item.ot_id },
      })
    }
  >
      <View style={styles.card}>
        <Text style={styles.title}>OT: {item.ot_id}</Text>
        <Text>Id del presupuesto: {item.mycard_id}</Text>
        <Text>Cantidad: {item.quantity}</Text>
        <Text>Estado: {item.status}</Text>
        <Text>Creado por: {item.user?.username}</Text>

        <Text style={styles.flowLine}>Áreas:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.flowLine}
          contentContainerStyle={styles.timelineContainer}
        >
          {item.flow.map((step, index) => {
            const isActive = step.status.toLowerCase().includes('proceso');
            const isCompleted = step.status.toLowerCase().includes('completado');
            const isParcial = step.status.toLowerCase() === 'parcial';
            const isCalidad = ['calidad', 'cqm'].some(word => step.status.toLowerCase().includes(word));
            const isLast = index === item.flow.length - 1;

            const getColor = () => {
              if (isCompleted) return '#22c55e';
              if (isCalidad) return '#facc15';
              if (isActive) return '#4a90e2';
              if (isParcial) return '#f5945c';
              return '#d1d5db';
            };

            return (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.circle, { backgroundColor: getColor(), shadowColor: getColor() }]}>
                  <Text style={styles.circleText}>{index + 1}</Text>
                </View>
                <Text
                  style={[
                    styles.areaLabel,
                    {
                      color: isCompleted
                        ? '#22c55e'
                        : isCalidad
                        ? '#facc15'
                        : isActive
                        ? '#4a90e2'
                        : isParcial
                        ? '#f5945c'
                        : '#6b7280',
                      fontWeight: isActive ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {step.area?.name ?? `Área ${step.area_id}`}
                </Text>
                {!isLast && <View style={styles.line} />}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

export default WorkOrderList;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  flowLine: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 10,
    overflow: 'scroll',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  areaLabel: {
    fontSize: 12,
    marginTop: 6,
    textTransform: 'capitalize',
    maxWidth: 90,
    textAlign: 'center',
  },
  line: {
    position: 'absolute',
    top: 14,
    left: 30,
    height: 2,
    backgroundColor: '#d1d5db',
    width: 90,
    zIndex: 1,
  },
});