import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { getPendingOrders } from '../../../api/aceptarProducto'; 
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { acceptWorkOrderFlow } from '../../../api/aceptarProducto';

interface WorkOrder {
  id: number;
  area_id: number;
  answers: {
    id: number;
    work_order_flow_id: number;
    accepted: boolean;
  }[];
  workOrder: {
    ot_id: string;
    priority: boolean;
    createdAt: string;
    mycard_id: string;
    quantity: number;
    flow: {
      id: string;
      area: {
        id: number;
        name: string;
      };
    }[];
    user: {
      username: string;
    };
    files: {
      id: number;
      type: string;
      file_path: string;
    }[];
  };
}

const VistosBuenosScreen = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch('http://192.168.80.22:3000/work-order-cqm/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
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
        Alert.alert("Error", "No se pudieron obtener las órdenes.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const aceptarOT = async () => {
    if (!selectedOrder) return;
  
    let index: number = 0;
    if (selectedOrder.answers?.length) {
      for (let i = selectedOrder.answers.length - 1; i >= 0; i--) {
        if (selectedOrder.answers[i].accepted === false) {
          index = i;
          break;
        }
      }
    }
  
    const flowId = index !== -1 ? selectedOrder.answers[index]?.id : null;
    if (!flowId) {
      Alert.alert('Error', 'No se encontró un ID válido para FormAnswer.');
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.80.22:3000/work-order-cqm/${flowId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (res.ok) {
        closeModal();
        // 🔄 Refrescar datos sin recargar pantalla
        setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      } else {
        const error = await res.json();
        Alert.alert('Error', error.message || 'No se pudo aceptar la OT');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Ocurrió un error al aceptar la OT');
    }
  };

  const openModal = (order: WorkOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
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
        <Text style={styles.text}>
          Fecha: {new Date(item.workOrder.createdAt).toLocaleDateString('es-ES')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes pendientes.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}

      {/* Modal Detalle */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>Orden: {selectedOrder.workOrder.ot_id}</Text>
                <Text style={styles.modalText}>Presupuesto: {selectedOrder.workOrder.mycard_id}</Text>
                <Text style={styles.modalText}>Cantidad: {selectedOrder.workOrder.quantity}</Text>
                <Text style={styles.modalText}>Prioridad: {selectedOrder.workOrder.priority ? 'Sí' : 'No'}</Text>
                <Text style={styles.modalText}>Creado por: {selectedOrder.workOrder.user.username}</Text>

                <View style={styles.rowButtons}>
                  <Pressable style={styles.modalButtonReject} onPress={closeModal}>
                    <Text style={styles.modalButtonText}>Cerrar</Text>
                  </Pressable>
                  <Pressable style={styles.modalButton} onPress={aceptarOT}>
                    <Text style={styles.modalButtonText}>Aceptar OT</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 4,
  },
  modalButtonReject: {
    marginTop: 20,
    backgroundColor: '#A9A9A9',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#0038A8',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  fileLink: {
    color: '#2563eb',
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});

export default VistosBuenosScreen;