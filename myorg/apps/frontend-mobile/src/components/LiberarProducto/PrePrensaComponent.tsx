// src/components/LiberarProducto/PrePrensaComponent.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { submitPrepressForm } from '../../api/liberarProducto';

const PrePrensaComponent: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [plates, setPlates] = useState('');
  const [positives, setPositives] = useState('');
  const [testType, setTestType] = useState('');
  const [comments, setComments] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  console.log('preprensa');

  const currentFlow = [...workOrder.workOrder.flow]
    .reverse()
    .find((item) =>
      ['Listo', 'En proceso', 'Enviado a CQM', 'En Calidad'].includes(
        item.status
      )
    );

  const handleSubmit = async () => {
    if (!plates || !positives || !testType) {
      Alert.alert('Completa todos los campos obligatorios.');
      return;
    }

    const payload = {
      workOrderId: workOrder.work_order_id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area_id,
      assignedUser: workOrder.assigned_user || null,
      plates: parseInt(plates),
      positives: parseInt(positives),
      testType,
      comments,
    };

    try {
      await submitPrepressForm(payload);
      Alert.alert('Producto liberado con éxito');
      navigation.navigate('liberarProducto');
    } catch (error) {
      Alert.alert('Error al liberar el producto.');
    } finally {
      setShowConfirm(false);
    }
  };

  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Área: Preprensa</Text>

          <ScrollView style={styles.scrollArea}>
            <Text style={styles.subtitle}>Datos de Producción</Text>

            <TextInput
              style={styles.input}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              placeholder="Placas"
              keyboardType="numeric"
              value={plates}
              onChangeText={setPlates}
            />
            <TextInput
              style={styles.input}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              placeholder="Positivos"
              keyboardType="numeric"
              value={positives}
              onChangeText={setPositives}
            />

            <Text style={styles.subtitle}>Tipo de Prueba</Text>
            {['color', 'fisica', 'digital'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioButton,
                  testType === option && styles.radioSelected,
                ]}
                onPress={() => setTestType(option)}
              >
                <Text style={styles.radioText}>{`Prueba ${option}`}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.subtitle}>Comentarios adicionales</Text>
            <TextInput
              style={styles.textarea}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              placeholder="Agrega un comentario..."
              multiline
              value={comments}
              onChangeText={setComments}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowConfirm(true)}
            >
              <Text style={styles.buttonText}>Liberar producto</Text>
            </TouchableOpacity>

            <Modal visible={showConfirm} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalText}>
                    ¿Deseas liberar este producto?
                  </Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowConfirm(false)}
                    >
                      <Text style={styles.modalButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.modalButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default PrePrensaComponent;

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
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  label: { fontWeight: '600', marginTop: 12 },
  value: { marginBottom: 8 },
  input: {
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minHeight: 30,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  radioButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginTop: 10,
  },
  radioSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#dbeafe',
  },
  radioText: { fontSize: 16 },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
});
