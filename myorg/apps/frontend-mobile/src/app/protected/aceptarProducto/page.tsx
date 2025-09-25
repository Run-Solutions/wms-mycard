'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import {
  getPendingOrders,
  acceptWorkOrderFlow,
} from '../../../api/aceptarProducto';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import DropDownPicker from 'react-native-dropdown-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { MobileCardPreview } from '../../../utils/MobileCardPreview';
import { getFileByName } from '../../../api/finalizacion';

export interface WorkOrder {
  id: number;
  work_order_id: number;
  area_id: number;
  status: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  workOrder: {
    id: number;
    ot_id: string;
    priority: boolean;
    mycard_id: string;
    quantity: number;
    comments: string;
    created_by: number;
    validated: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: number;
      username: string;
    };
    files: {
      id: number;
      type: string;
      file_path: string;
    }[];
    flow: {
      id: number;
      status: string;
      assigned_user: number;
      area: {
        id: number;
        name: string;
      };
    }[];
  };
  areaResponse: {
    id: number;
    prepress: {
      id: number;
      plates: number;
      positives: number;
      testType: string;
      comments: string;
    };
  };
}

export type PartialRelease = { validated: boolean; quantity: number };

export type WorkOrderFlow = {
  id: number;
  area_id: number;
  status: string;
  assigned_user: number | null;
  work_order_id: number;
  partialReleases?: PartialRelease[];
};

function puedeAceptarNuevaEtapa(
  currentFlow: WorkOrderFlow,
  allFlows: WorkOrderFlow[],
  currentUserId: number
): boolean {
  const prevSameArea = allFlows.filter(
    (f) =>
      f.area_id === currentFlow.area_id &&
      f.id < currentFlow.id &&
      f.assigned_user === currentUserId
  );
  if (prevSameArea.length === 0) return true;
  for (const f of prevSameArea) {
    const pendiente =
      ['Parcial', 'Listo'].includes(f.status) ||
      (f.partialReleases || []).some((r) => !r.validated);
    if (pendiente) return false;
  }
  return true;
}

type NavigationType = CompositeNavigationProp<
  DrawerNavigationProp<RootStackParamList>,
  NavigationProp<RootStackParamList>
>;

type SortBy = 'priority' | 'createdAt' | 'quantity' | 'ot' | 'mycard';
type SortDir = 'asc' | 'desc';

const AceptarProductoScreen = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔎 Buscador + Organizador (como la web)
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // DropDownPicker states (dos pickers: sortBy, sortDir)
  const [openSortBy, setOpenSortBy] = useState(false);
  const [openSortDir, setOpenSortDir] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const { user } = useAuth();
  const navigation = useNavigation<NavigationType>();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getPendingOrders();
      if (Array.isArray(data)) {
        setOrders(data); 
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar las órdenes pendientes');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  // Lista filtrada + ordenada (igual lógica que en web)
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (orders || []).filter((o) => {
      const w = o.workOrder;
      const m =
        w?.ot_id?.toLowerCase().includes(q) ||
        w?.mycard_id?.toLowerCase().includes(q) ||
        w?.user?.username?.toLowerCase().includes(q) ||
        w?.comments?.toLowerCase().includes(q);
      return q === '' ? true : !!m;
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    const sorted = filtered.sort((a, b) => {
      const wa = a.workOrder;
      const wb = b.workOrder;
      if (!wa || !wb) return 0;

      switch (sortBy) {
        case 'priority': {
          const pa = wa.priority ? 1 : 0;
          const pb = wb.priority ? 1 : 0;
          if (pa !== pb) return (pb - pa) * dir; // prioridad primero/último
          const da = new Date(wa.createdAt).getTime();
          const db = new Date(wb.createdAt).getTime();
          return (da - db) * dir;
        }
        case 'createdAt': {
          const da = new Date(wa.createdAt).getTime();
          const db = new Date(wb.createdAt).getTime();
          return (da - db) * dir;
        }
        case 'quantity':
          return (wa.quantity - wb.quantity) * dir;
        case 'ot':
          return (wa.ot_id || '').localeCompare(wb.ot_id || '') * dir;
        case 'mycard':
          return (wa.mycard_id || '').localeCompare(wb.mycard_id || '') * dir;
        default:
          return 0;
      }
    });

    // En web invertimos si sortBy='priority' para mostrar true arriba en "desc".
    if (sortBy === 'priority') {
      return sortDir === 'asc' ? sorted.reverse() : sorted;
    }
    return sorted;
  }, [orders, query, sortBy, sortDir]);

  const openModal = (order: WorkOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };
  const closeModal = () => {
    setSelectedOrder(null);
    setModalVisible(false);
  };

  const aceptarOT = async () => {
    if (!selectedOrder) return;
    const flowItem = [...(selectedOrder?.workOrder.flow || [])]
      .reverse()
      .find(
        (f) =>
          f.area.id === selectedOrder.area_id &&
          f.status === selectedOrder.status
      );
    if (!flowItem) {
      Alert.alert('Error', 'No se encontró el flujo activo para esta área');
      return;
    }
    const flowId = flowItem.id;
    const mappedFlows = selectedOrder.workOrder.flow.map((f) => ({
      id: f.id,
      status: f.status,
      area_id: f.area.id,
      assigned_user: f.assigned_user ?? null,
      work_order_id: selectedOrder.workOrder.id,
      partialReleases: (f as any).partialReleases || [],
    }));

    const currentUserId = user?.sub as unknown as number | undefined;
    if (!currentUserId) return;

    const puede = puedeAceptarNuevaEtapa(
      {
        ...flowItem,
        area_id: selectedOrder.area_id,
        assigned_user: currentUserId ?? null,
        work_order_id: selectedOrder.work_order_id,
      },
      mappedFlows,
      currentUserId
    );
    if (!puede) {
      Alert.alert(
        'Error',
        'Debes liberar completamente tu participación anterior antes de aceptar esta etapa.'
      );
      return;
    }
    if (selectedOrder.area_id >= 2) {
      closeModal();
      navigation.navigate('Principal', {
        screen: 'AceptarProductoAuxScreen',
        params: { flowId: String(flowId) },
      });
      return;
    }
    try {
      await acceptWorkOrderFlow(String(flowId));
      Alert.alert('OT aceptada', 'La orden fue aceptada exitosamente.');
      closeModal();
      fetchOrders();
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Error al conectar con el servidor.'
      );
    }
  };

  const renderItem = ({ item }: { item: WorkOrder }) => {
    const fecha = new Date(item.workOrder.createdAt).toLocaleDateString('es-ES');
    const files = (item as any).workOrder?.files || []; 
  
    return (
      <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
        {item.workOrder.priority && <View style={styles.priorityBadge} />}
  
        {/* Preview como en la web */}
        <View style={{ flex: 1 }}>
          <MobileCardPreview
            files={files}
            getFile={(name) => getFileByName(name)} // devuelve binario/base64, el helper lo normaliza
          />
  
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔎 Toolbar móvil */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar por OT / MyCard / usuario / comentario"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#888"
          />
          {query ? (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery('')}>
              <Text style={styles.clearBtnText}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sortRow}>
          <View style={{ flex: 1, zIndex: 5000 }}>
            <DropDownPicker
              open={openSortBy}
              setOpen={(val) => {
                const isOpen = typeof val === 'function' ? val(openSortBy) : val; 
                setOpenSortBy(isOpen);
                if (isOpen) setOpenSortDir(false);
              }}
              value={sortBy}
              setValue={(v) => setSortBy((typeof v === 'function' ? v(sortBy) : v) as SortBy)}
              items={[
                { label: 'Ordenar: Prioridad', value: 'priority' },
                { label: 'Ordenar: Fecha creación', value: 'createdAt' },
                { label: 'Ordenar: Cantidad', value: 'quantity' },
                { label: 'Ordenar: OT', value: 'ot' },
                { label: 'Ordenar: MyCard', value: 'mycard' },
              ]}
              style={styles.ddPicker}
              dropDownContainerStyle={styles.ddContainer}
              placeholder="Ordenar por…"
            />
          </View>

          <View style={{ width: 150, zIndex: 4000 }}>
            <DropDownPicker
              open={openSortDir}
              setOpen={(val) => {
                const isOpen = typeof val === 'function' ? val(openSortDir) : val; 
                setOpenSortDir(isOpen);
                if (isOpen) setOpenSortBy(false);
              }}
              value={sortDir}
              setValue={(v) => setSortDir((typeof v === 'function' ? v(sortDir) : v) as SortDir)}
              items={[
                { label: 'Descendente', value: 'desc' },
                { label: 'Ascendente', value: 'asc' },
              ]}
              style={styles.ddPicker}
              dropDownContainerStyle={styles.ddContainer}
              placeholder="Dirección"
            />
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : filteredSorted.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes que coincidan.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSorted}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Modal detalle */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>
                  Orden: {selectedOrder.workOrder.ot_id}
                </Text>
                <Text style={styles.modalText}>
                  Id del Presupuesto: {selectedOrder.workOrder.mycard_id}
                </Text>
                <Text style={styles.modalText}>
                  Cantidad: {selectedOrder.workOrder.quantity}
                </Text>
                <Text style={styles.modalText}>
                  Creado por: {selectedOrder.workOrder.user.username}
                </Text>
                <Text style={styles.modalText}>
                  Prioridad: {selectedOrder.workOrder.priority ? 'Sí' : 'No'}
                </Text>
                <Text style={styles.modalText}>
                  Comentarios: {selectedOrder.workOrder.comments}
                </Text>
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

export default AceptarProductoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  toolbar: {
    marginBottom: 12,
  },
  searchBox: {
    position: 'relative',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 44,
    color: '#111827',
  },
  clearBtn: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 20,
    color: '#111827',
    marginTop: -2,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ddPicker: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    minHeight: 44,
  },
  ddContainer: {
    borderColor: '#e5e7eb',
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
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalText: { fontSize: 16, marginVertical: 4 },
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
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50,
  },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
});