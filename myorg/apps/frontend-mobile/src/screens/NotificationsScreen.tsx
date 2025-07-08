// myorg/apps/frontend-mobile/src/screens/NotificationsScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, List, IconButton } from 'react-native-paper';
import { getNotificationHistory, markNotificationAsRead } from '../api/notifications';
import { AuthContext } from '../contexts/AuthContext';

const NotificationsScreen: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getNotificationHistory(user.sub);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    fetchNotifications();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={item.body}
            left={(props) => (
              <List.Icon {...props} icon={item.isRead ? "bell-outline" : "bell"} />
            )}
            right={(props) =>
              !item.isRead && (
                <IconButton
                  {...props}
                  icon="check"
                  onPress={() => handleMarkAsRead(item.id)}
                />
              )
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No tienes notificaciones.</Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
});