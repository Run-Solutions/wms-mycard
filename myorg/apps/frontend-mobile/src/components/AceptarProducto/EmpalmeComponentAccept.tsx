// src/components/AceptarProducto/EmpalmeComponentAccept.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Modal, Alert, ScrollView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { acceptWorkOrderFlow } from '../../api/aceptarProducto';
import { registrarInconformidad } from '../../api/aceptarProducto';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type EmpalmeData = {
  release_quantity: string;
  comments: string;
};

interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  // otros campos si aplica
}

const EmpalmeComponentAccept: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [defaultValues, setDefaultValues] = useState({
    release_quantity: '',
    comments: '',
  });

  console.log("El mismo workOrder (workOrder)", workOrder);
  const flowList = [...workOrder.workOrder.flow];
  // Índice del flow actual basado en su id
  const currentIndex = flowList.findIndex((item) => item.id === workOrder.id);
  console.log('el currentIndex', currentIndex);
  // Flow actual
  const currentFlow = currentIndex !== -1 ? flowList[currentIndex] : null;
  // Anterior (si hay)
  const lastCompletedOrPartial = currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow = currentIndex !== -1 && currentIndex < flowList.length - 1
    ? flowList[currentIndex + 1]
    : null;
  console.log("El flujo actual (currentFlow)", currentFlow);
  console.log("El siguiente flujo (nextFlow)", nextFlow);
  console.log("Ultimo parcial o completado", lastCompletedOrPartial);

    useEffect(() => {
      // Al iniciar, configuramos los valores predeterminados y actuales
      if (lastCompletedOrPartial?.areaResponse?.empalme && lastCompletedOrPartial?.partialReleases.length === 0) {
        const vals: EmpalmeData = {
          release_quantity: lastCompletedOrPartial.areaResponse.empalme.release_quantity || "",
          comments: lastCompletedOrPartial.areaResponse.empalme.comments || "",
        };
        setDefaultValues(vals);
      } else {
        const firstUnvalidatedPartial = lastCompletedOrPartial.partialReleases.find(
          (release: PartialRelease) => !release.validated
        );
      
        const vals: EmpalmeData = {
          release_quantity: firstUnvalidatedPartial?.quantity || "",
          comments: firstUnvalidatedPartial?.observation || "",
        };
      
        setDefaultValues(vals);
      }
    }, [workOrder]);

  const handleAceptar = async () => {
    try {
      await acceptWorkOrderFlow(workOrder.id);
      Alert.alert("Recepción aceptada");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo aceptar la orden");
    }
  };

  const handleInconformidad = async () => {
    if (!inconformidad.trim()) {
      Alert.alert("Por favor describe la inconformidad.");
      return;
    }
    try {
      await registrarInconformidad(lastCompletedOrPartial?.id, inconformidad);
      Alert.alert("Inconformidad registrada");
      setShowInconformidad(false);
      navigation.navigate('aceptarProducto');
    } catch (err) {
      console.error(err);
      Alert.alert("Error al enviar inconformidad");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Área: {workOrder.area.name}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text style={styles.value}>{workOrder.workOrder.ot_id}</Text>

        <Text style={styles.label}>Presupuesto:</Text>
        <Text style={styles.value}>{workOrder.workOrder.mycard_id}</Text>

        <Text style={styles.label}>Cantidad:</Text>
        <Text style={styles.value}>{workOrder.workOrder.quantity}</Text>

        <Text style={styles.label}>Área que lo envía:</Text>
        <Text style={styles.value}>{lastCompletedOrPartial?.area?.name || 'No definida'}</Text>

        <Text style={styles.label}>Usuario:</Text>
        <Text style={styles.value}>{lastCompletedOrPartial?.user?.username || 'No definido'}</Text>
        
        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
      </View>

      <Text style={styles.subtitle}>Cantidad entregada</Text>
      <Text style={styles.input}>{defaultValues.release_quantity}</Text>

      <Text style={styles.subtitle}>Comentarios</Text>
      <Text style={styles.input}>{defaultValues.comments}</Text>
      <View style={styles.modalActions}>
        <TouchableOpacity style={styles.incoButton} onPress={() => setShowInconformidad(true)}>
          <Text style={styles.buttonText}>Inconformidad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={() => setShowConfirm(true)}>
          <Text style={styles.buttonText}>Aceptar recepción de producto</Text>
        </TouchableOpacity>
      </View>
      {/* Modal confirmación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Deseas aceptar la recepción del producto?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirm(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAceptar}>
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal inconformidad */}
      <Modal visible={showInconformidad} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Describe la inconformidad:</Text>
            <TextInput
              value={inconformidad}
              onChangeText={setInconformidad}
              placeholder="Escribe la inconformidad..."
              multiline
              style={styles.textarea}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowInconformidad(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleInconformidad}>
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default EmpalmeComponentAccept;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 8, 
    backgroundColor: '#fdfaf6', 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 10 : 0,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
  },
  value: { marginBottom: 6 },
  subtitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    height: 50,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  textarea: {
    backgroundColor: '#fff', padding: 12, borderRadius: 12,
    borderColor: '#ccc', borderWidth: 1, textAlignVertical: 'top', height: 100
  },
  acceptButton: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  incoButton: {
    backgroundColor: '#A9A9A9',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center'
  },
  modalBox: {
    backgroundColor: '#fff', padding: 24,
    borderRadius: 16, width: '85%'
  },
  modalText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});