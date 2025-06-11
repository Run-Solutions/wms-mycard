import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { acceptImpressionInconformity } from '../../api/inconformidades';

interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}

const ImpresionComponent: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Obtener la última parcialidad sin validar
  const lastPartialRelease = workOrder.partialReleases.find(
    (release: PartialRelease) => !release.validated
  );

  // Para los valores mostrados
  const releaseQuantity = lastPartialRelease
    ? lastPartialRelease.quantity
    : workOrder.areaResponse?.impression.release_quantity;
  console.log(releaseQuantity);

  const releaseComments = lastPartialRelease
    ? lastPartialRelease.observation
    : workOrder.areaResponse?.impression.comments;

  const inconformityUser = lastPartialRelease
    ? lastPartialRelease.inconformities[0]?.user.username
    : workOrder.areaResponse?.inconformities.at(-1)?.user.username;

  const inconformityComments = lastPartialRelease
    ? lastPartialRelease.inconformities[0]?.comments
    : workOrder.areaResponse?.inconformities.at(-1)?.comments;

  const handleSubmit = async () => {
    const partialRelease = workOrder.partialReleases.find(
      (release: PartialRelease) => !release.validated
    );
    const areaResponseFlowId = workOrder.areaResponse
    ? workOrder.areaResponse.work_order_flow_id
    : partialRelease?.work_order_flow_id;

    console.log(areaResponseFlowId);
    try {
  
      await acceptImpressionInconformity(areaResponseFlowId);
      setShowModal(false);
      Alert.alert('Inconformidad aceptada');
      navigation.navigate('liberarProducto');
    } catch (error: any) {
      Alert.alert('Error al aceptar', error.message || 'Ocurrió un error');
    } finally {
      setShowModal(false);
    }
  };

  return (
    <View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        <Text style={styles.title}>Área: Impresión</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Entregaste:</Text>
          <TextInput style={styles.input} editable={false} value={String(releaseQuantity)} />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={releaseComments}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Inconformidad:</Text>

          <Text style={styles.label}>Respuesta de Usuario</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={inconformityUser}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={inconformityComments}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={openModal}>
          <Text style={styles.buttonText}>Aceptar Inconformidad</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />

        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>
                ¿Estás segura/o que deseas aceptar la inconformidad? Deberás liberar nuevamente.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
                  <Text style={styles.modalButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

export default ImpresionComponent;

const styles = StyleSheet.create({
  container: { 
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
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 50,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 100,
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
  button: {
    backgroundColor: '#0038A8',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
    width: '85%',
  },
  modalText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});