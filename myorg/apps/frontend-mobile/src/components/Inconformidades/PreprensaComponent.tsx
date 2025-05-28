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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { acceptPrepressInconformity } from '../../api/inconformidades';

const PreprensaComponent: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const lastIndex = workOrder.areaResponse.inconformities.length > 1 
    ? workOrder.areaResponse.inconformities.length - 1 
    : 0;

  const handleSubmit = async () => {
    try {
      const areaResponseId = workOrder.areaResponse.id;
  
      await acceptPrepressInconformity(areaResponseId);
  
      Alert.alert('Inconformidad aceptada');
      navigation.navigate('liberarProducto');
    } catch (error: any) {
      Alert.alert('Error al aceptar', error.message || 'Ocurrió un error');
    } finally {
      setShowModal(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Área: Preprensa</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Entregaste:</Text>
        <Text style={styles.label}>Placas</Text>
        <TextInput style={styles.input} editable={false} value={String(workOrder.areaResponse.prepress.plates)} />

        <Text style={styles.label}>Positivos</Text>
        <TextInput style={styles.input} editable={false} value={String(workOrder.areaResponse.prepress.positives)} />

        <Text style={[styles.subtitle, { marginTop: 12 }]}>Tipo de Prueba</Text>
        <View style={styles.radioGroup}>
          {['color', 'fisica', 'digital'].map((type) => (
            <View key={type} style={styles.radioItem}>
              <Text style={styles.radioText}>
                {type === workOrder.areaResponse.prepress.testType ? '🔘' : '⚪'} Prueba {type}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Comentarios</Text>
        <TextInput
          style={styles.textarea}
          multiline
          editable={false}
          value={workOrder.areaResponse.prepress.comments}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Inconformidad:</Text>

        <Text style={styles.label}>Respuesta de Usuario</Text>
        <TextInput
          style={styles.input}
          editable={false}
          value={workOrder.areaResponse.inconformities[lastIndex]?.user?.username}
        />

        <Text style={styles.label}>Comentarios</Text>
        <TextInput
          style={styles.textarea}
          multiline
          editable={false}
          value={workOrder.areaResponse.inconformities[lastIndex]?.comments}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={openModal}>
        <Text style={styles.buttonText}>Aceptar Inconformidad</Text>
      </TouchableOpacity>

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
  );
};

export default PreprensaComponent;

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
  radioGroup: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
  },
  radioItem: {
    marginVertical: 4,
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
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
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});