// myorg/apps/frontend-mobile/src/screens/NotificationsScreen.tsx
import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  List,
  IconButton,
  Text,
  ActivityIndicator,
  Divider,
  Portal,
  Dialog,
  TextInput,
  Button,
} from 'react-native-paper';
import {
  useNotifications,
  getNotificationRoute,
  shouldShowPlannerAuditorModal,
  shouldShowPlannerCqmModal,
  type AppNotification,
} from './useNotifications';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation, CommonActions } from '@react-navigation/native';

const NotificationsScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { list, loading, fetchNotifications, markAsRead } = useNotifications();

  // --- estado del modal (planeador + rechazos) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAuditorVisible, setModalAuditorVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(
    null
  );

  const goNested = (screenName: string, params?: any) => {
    // Si tienes Drawer con id="RootDrawer", mejor usa CommonActions.navigate
    const drawer = (nav as any).getParent?.('RootDrawer');
    if (drawer) {
      drawer.dispatch(
        CommonActions.navigate({
          name: 'Principal',
          params: { screen: screenName, params },
        })
      );
    } else {
      nav.navigate(screenName as never, params as unknown as never);
    }
  };

  const handlePress = (item: AppNotification) => {
    // 1) caso especial: planeador + rechazos => abrir modal y salir
    if (shouldShowPlannerCqmModal(item, user)) {
      setSelectedNotif(item);
      setModalVisible(true);
      if (!item.isRead) markAsRead(item.id);
      return;
    } else if (shouldShowPlannerAuditorModal(item, user)) {
      setSelectedNotif(item);
      setModalAuditorVisible(true);
      if (!item.isRead) markAsRead(item.id);
      return;
    }

    // 2) flujo normal de navegación
    const route = getNotificationRoute(item, user);
    console.log('Navegando a:', route);
    if (!route) return;

    const ot = item.payload?.workOrderId
      ? Number(item.payload.workOrderId)
      : undefined;
    const params = ot ? { id: ot } : undefined;

    if (!item.isRead) markAsRead(item.id);

    // Si tienes Drawer anidado:
    const parent = nav.getParent?.();
    if (parent) {
      parent.navigate(
        'Principal' as never,
        { screen: route, params } as unknown as never
      );
    } else {
      nav.navigate(route as never, params as unknown as never);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedNotif(null);
  };
  const handleModalAuditorClose = () => {
    setModalAuditorVisible(false);
    setSelectedNotif(null);
  };

  const handleModalGoToRechazos = () => {
    if (!selectedNotif) return;
    const ot = selectedNotif.payload?.workOrderId
      ? Number(selectedNotif.payload.workOrderId)
      : undefined;
    const params = ot ? { id: ot } : undefined;

    // Ajusta al nombre REAL registrado en tu stack ("RechazosScreen" si lo registraste así)
    goNested('RechazosScreen', params);
    handleModalClose();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
        }
        renderItem={({ item }) => (
          <>
            <List.Item
              title={item.title}
              description={`${item.body ?? ''}${
                item.date ? `\n${new Date(item.date).toLocaleString()}` : ''
              }`}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={item.isRead ? 'bell-outline' : 'bell'}
                />
              )}
              right={(props) =>
                !item.isRead && (
                  <IconButton
                    {...props}
                    icon="check"
                    onPress={() => markAsRead(item.id)}
                  />
                )
              }
              onPress={() => handlePress(item)}
              style={[
                styles.item,
                {
                  backgroundColor: item.isRead
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(25,118,210,0.08)',
                },
              ]}
            />
            <Divider style={{ opacity: 0.4 }} />
          </>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text>No tienes notificaciones.</Text>
            )}
          </View>
        }
      />

      {/* Modal: planeador + rechazos */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={handleModalClose}>
          <Dialog.Title>Inconformidad CQM</Dialog.Title>

          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              {selectedNotif?.body ?? 'Tienes rechazos pendientes de revisión.'}
            </Text>

            <Text variant="labelLarge" style={{ marginBottom: 6 }}>
              Comentarios
            </Text>
            <TextInput
              mode="outlined"
              activeOutlineColor="#000"
              style={styles.input}
              theme={{ roundness: 30 }}
              value={
                selectedNotif?.inconformity?.comments?.trim()
                  ? selectedNotif.inconformity!.comments
                  : 'Sin comentarios'
              }
              editable={false}
              multiline
            />

            <Text
              variant="labelLarge"
              style={{ marginTop: 12, marginBottom: 6 }}
            >
              Inconformidad aceptada
            </Text>
            <TextInput
              mode="outlined"
              activeOutlineColor="#000"
              style={styles.input}
              theme={{ roundness: 30 }}
              value={
                selectedNotif?.inconformity
                  ? selectedNotif.inconformity.reviewed
                    ? 'Sí'
                    : 'En espera de revisión'
                  : 'En espera de revisión'
              }
              editable={false}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={handleModalClose}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={modalAuditorVisible} onDismiss={handleModalClose}>
          <Dialog.Title>Inconformidad Auditoría</Dialog.Title>

          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              {selectedNotif?.body ?? 'Tienes rechazos pendientes de revisión.'}
            </Text>

            <Text variant="labelLarge" style={{ marginBottom: 6 }}>
              Comentarios
            </Text>
            <TextInput
              mode="outlined"
              activeOutlineColor="#000"
              style={styles.input}
              theme={{ roundness: 30 }}
              value={
                selectedNotif?.inconformity?.comments?.trim()
                  ? selectedNotif.inconformity!.comments
                  : 'Sin comentarios'
              }
              editable={false}
              multiline
            />

            <Text
              variant="labelLarge"
              style={{ marginTop: 12, marginBottom: 6 }}
            >
              Inconformidad aceptada
            </Text>
            <TextInput
              mode="outlined"
              activeOutlineColor="#000"
              style={styles.input}
              theme={{ roundness: 30 }}
              value={
                selectedNotif?.inconformity
                  ? selectedNotif.inconformity.reviewed
                    ? 'Sí'
                    : 'En espera de revisión'
                  : 'En espera de revisión'
              }
              editable={false}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={handleModalAuditorClose}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  item: { borderRadius: 10, marginVertical: 4 },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    fontSize: 14,
  },
});
