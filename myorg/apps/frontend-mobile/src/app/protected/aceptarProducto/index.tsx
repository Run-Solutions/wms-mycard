import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface WorkOrder {
  id: number;
  workOrder: {
    ot_id: string;
    priority: boolean;
    createdAt: string;
    mycard_id: string;
    quantity: number;
    user: {
      username: string;
    };
  };
}

const AceptarProductoScreen = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('http://192.168.80.22:3000/work-order-flow/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log(data)
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => {
            if (a.workOrder.priority && !b.workOrder.priority) return -1;
            if (!a.workOrder.priority && b.workOrder.priority) return 1;
            return new Date(a.workOrder.createdAt).getTime() - new Date(b.workOrder.createdAt).getTime();
          });
          setOrders(sorted);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: WorkOrder }) => {
    const fecha = new Date(item.workOrder.createdAt).toLocaleDateString('es-ES');
    return (
      <TouchableOpacity style={styles.card}>
        {item.workOrder.priority && <View style={styles.priorityBadge} />}
        <View style={styles.cardContent}>
          <Text style={styles.otId}>{item.workOrder.ot_id}</Text>
          <View style={styles.row}>
            <Text style={styles.bold}>{item.workOrder.mycard_id}</Text>
            <Text style={[styles.bold, { marginLeft: 'auto' }]}>
              Cantidad: {item.workOrder.quantity}
            </Text>
          </View>
          <Text style={styles.text}>Creado por: {item.workOrder.user.username}</Text>
          <Text style={styles.text}>Fecha de creación: {fecha}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" /> :
        orders.length === 0 ? <Text>No hay órdenes pendientes.</Text> :
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
        />
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0038A8',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    marginLeft: 20,
  },
  otId: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
  },
  bold: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 10,
  },
  priorityBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFD700',
    position: 'absolute',
    top: 10,
    left: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 6,
  },
});

export default AceptarProductoScreen;