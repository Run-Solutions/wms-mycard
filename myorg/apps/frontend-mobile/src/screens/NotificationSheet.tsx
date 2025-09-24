// myorg/apps/frontend-mobile/src/components/NotificationSheet.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Portal,
  Modal,
  List,
  Text,
  IconButton,
  ActivityIndicator,
  Divider,
  Badge,
  useTheme,
} from 'react-native-paper';
import { useNotifications, AppNotification } from './useNotifications';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onItemPress: (n: AppNotification) => void;
};

const NotificationSheet: React.FC<Props> = ({ visible, onDismiss, onItemPress }) => {
  const theme = useTheme();
  const { list, loading, error, unreadCount, fetchNotifications, markAsRead } =
    useNotifications();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.dark ? '#121212' : '#fff' },
        ]}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Notificaciones
          </Text>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <Badge size={20} style={styles.unreadPill}>
                {unreadCount}
              </Badge>
            )}
            <IconButton icon="refresh" onPress={fetchNotifications} />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text>{error}</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.center}>
            <Text>Sin notificaciones por ahora</Text>
          </View>
        ) : (
          <View>
            {list.map((n, idx) => (
              <View key={n.id}>
                <List.Item
                  title={() => (
                    <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                      {n.title}
                    </Text>
                  )}
                  description={() => (
                    <>
                      {!!n.body && <Text>{n.body}</Text>}
                      {!!n.date && (
                        <Text style={{ opacity: 0.7, marginTop: 4, fontSize: 12 }}>
                          {new Date(n.date).toLocaleString()}
                        </Text>
                      )}
                    </>
                  )}
                  left={(props) => (
                    <List.Icon {...props} icon={n.isRead ? 'bell-outline' : 'bell'} />
                  )}
                  right={(props) =>
                    !n.isRead ? (
                      <IconButton
                        {...props}
                        icon="check"
                        onPress={() => markAsRead(n.id)}
                        accessibilityLabel="Marcar como leída"
                      />
                    ) : null
                  }
                  onPress={() => onItemPress(n)}
                  style={[
                    styles.item,
                    {
                      backgroundColor: n.isRead
                        ? (theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
                        : (theme.dark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.08)'),
                    },
                  ]}
                />
                {idx < list.length - 1 && <Divider style={{ opacity: 0.4 }} />}
              </View>
            ))}
          </View>
        )}
      </Modal>
    </Portal>
  );
};

export default NotificationSheet;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  header: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  unreadPill: { backgroundColor: '#ff3b30' },
  center: { alignItems: 'center', padding: 20 },
  item: { borderRadius: 10, marginVertical: 4 },
});