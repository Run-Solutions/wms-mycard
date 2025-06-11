// src/components/AceptarProducto/PrepressComponentAccept.tsx
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

const PrepressComponentAccept: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [defaultValues, setDefaultValues] = useState({
    plates: '',
    positives: '',
    testType: '',
    comments: '',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');

  const lastCompleted = [...workOrder.workOrder.flow]
    .reverse()
    .find((item) => item.status === "Completado");

  useEffect(() => {
    if (lastCompleted?.areaResponse?.prepress) {
      const { plates, positives, testType, comments } = lastCompleted.areaResponse.prepress;
      setDefaultValues({
        plates: String(plates || ''),
        positives: String(positives || ''),
        testType: testType || '',
        comments: comments || '',
      });
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
      await registrarInconformidad(lastCompleted?.id, inconformidad);
      Alert.alert("Inconformidad registrada");
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
        <Text style={styles.value}>{lastCompleted?.area?.name || 'No definida'}</Text>

        <Text style={styles.label}>Usuario:</Text>
        <Text style={styles.value}>{lastCompleted?.user?.username || 'No definido'}</Text>
        
        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
      </View>

      <Text style={styles.subtitle}>Cantidad entregada</Text>
      <Text style={styles.input}>Placas: {defaultValues.plates}</Text>
      <Text style={styles.input}>Positivos: {defaultValues.positives}</Text>

      <Text style={styles.subtitle}>Tipo de prueba</Text>
      <Text style={styles.input}>{defaultValues.testType}</Text>

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

export default PrepressComponentAccept;

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