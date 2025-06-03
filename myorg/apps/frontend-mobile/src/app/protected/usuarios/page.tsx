//myorg/apps/frontend-mobile/src/app/protected/usuarios/page.tsx
"use client"; 

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator
} from 'react-native';
import Table from '../../../components/Usuarios/Table';
import { getUsers, deleteUser, updateUser } from '../../../api/usuarios';
import UpdateUserModal from '../../../components/Usuarios/UpdateUserModal';

const UsuariosScreen: React.FC = () => {
  const headers = [
    { key: 'profile_image', label: 'Foto', width: 50 },
    { key: 'username', label: 'Usuario', width: 120 },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'phone', label: 'Teléfono', width: 120 },
    { key: 'role', label: 'Rol', width: 100 },
  ];

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      if (response) {
        setUsers(response);
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePress = (id: number) => {
    setSelectedUserId(id);
    setModalVisible(true);
  };

  const confirmDelete = async () => {
    if (selectedUserId === null) return;
    setOperationLoading(true);
    try {
      await deleteUser(selectedUserId);
      await fetchUsers();
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
    } finally {
      setOperationLoading(false);
      setModalVisible(false);
    }
  };

  const handleEditPress = (user: any) => {
    setSelectedUser(user);
    setUpdateModalVisible(true);
  };

  const handleUpdateSubmit = async (id: number, data: { username: string; email: string; phone: string }) => {
    setUpdateLoading(true);
    try {
      await updateUser(id, data);
      await fetchUsers();
      setUpdateModalVisible(false);
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Usuarios</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Table
          headers={headers}
          data={users}
          renderActions={(item) => (
            <View style={styles.actionsCell}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => handleEditPress(item)}
              >
                <Text style={styles.buttonText}>EDITAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => handleDeletePress(item.id)}
              >
                <Text style={styles.buttonText}>ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas eliminar este usuario?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={operationLoading}
              >
                <Text style={styles.buttonTextModal}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={confirmDelete}
                disabled={operationLoading}
              >
                <Text style={styles.buttonTextModal}>
                  {operationLoading ? '...' : 'Sí'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de actualización de usuario */}
      <UpdateUserModal
        visible={updateModalVisible}
        loading={updateLoading}
        user={selectedUser}
        onCancel={() => setUpdateModalVisible(false)}
        onSubmit={handleUpdateSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#fdfaf6' },
  header: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: 'black',
      padding: Platform.OS === 'ios' ? 14 : 0,
    },
  actionsCell: { flexDirection: 'row', justifyContent: 'center', flex: 1 },
  button: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, marginHorizontal: 4 },
  editButton: { backgroundColor: '#0044cc' },
  deleteButton: { backgroundColor: '#cc0000' },
  cancelButton: { backgroundColor: '#888' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 8 },
  buttonTextModal : { color: '#fff', fontWeight: 'bold', fontSize: 10 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default UsuariosScreen;