import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { acceptLaminacionInconformity } from '../../api/inconformidades';

interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}

const LaminacionComponent: React.FC<{ workOrder: any }> = ({ workOrder }) => {
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
    : workOrder.areaResponse?.laminacion.release_quantity;
  console.log(releaseQuantity);

  const releaseComments = lastPartialRelease
    ? lastPartialRelease.observation
    : workOrder.areaResponse?.laminacion.comments;

    const inconformityList = lastPartialRelease
    ? lastPartialRelease.inconformities
    : workOrder.areaResponse?.inconformities || [];

  const lastUnreviewedInconformity = [...inconformityList]
    .reverse()
    .find((i) => i.reviewed === false);

  const inconformityUser = lastUnreviewedInconformity?.user.username;
  const inconformityComments = lastUnreviewedInconformity?.comments;

  const handleSubmit = async () => {
    const partialRelease = workOrder.partialReleases.find(
      (release: PartialRelease) => !release.validated
    );
    const areaResponseFlowId = workOrder.areaResponse
      ? workOrder.areaResponse.work_order_flow_id
      : partialRelease?.work_order_flow_id;

    console.log(areaResponseFlowId);
    try {

      await acceptLaminacionInconformity(areaResponseFlowId);
      setShowModal(false);
      Alert.alert('Inconformidad aceptada');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error al aceptar', error.message || 'Ocurrió un error');
    } finally {
      setShowModal(false);
    }
  };

  return (
    <View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 230 }]}>
        <Text style={styles.title}>Área: Laminación</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Entregaste:</Text>
          <TextInput style={styles.input} editable={false} value={String(releaseQuantity)}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={releaseComments}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Inconformidad:</Text>

          <Text style={styles.label}>Respuesta de Usuario</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={inconformityUser}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={inconformityComments}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
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

export default LaminacionComponent;

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
    padding: 10,
    marginBottom: 12,
    height: 30,
    fontSize: 16,
  },
  textarea: {
    padding: 10,
    marginBottom: 12,
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