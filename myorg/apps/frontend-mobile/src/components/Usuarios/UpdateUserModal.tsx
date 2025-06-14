import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { TextInput } from 'react-native-paper';
interface UpdateUserModalProps {
  visible: boolean;
  loading: boolean;
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
  } | null;
  onCancel: () => void;
  onSubmit: (id: number, data: { username: string; email: string; phone: string }) => void;
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({
  visible,
  loading,
  user,
  onCancel,
  onSubmit
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);

  const handleSave = () => {
    if (user) {
      onSubmit(user.id, { username, email, phone });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <Text style={styles.title}>Actualizar Usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          activeOutlineColor="#000"
          theme={{ roundness: 30 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          activeOutlineColor="#000"
          theme={{ roundness: 30 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          mode="outlined"
          activeOutlineColor="#000"
          theme={{ roundness: 30 }}
        />
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  saveButton: {
    backgroundColor: '#0044cc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10
  },
});

export default UpdateUserModal;