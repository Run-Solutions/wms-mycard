import API from "./http";

export async function savePushToken(userId: number, token: string) {
  await API.post("/device-tokens", { userId, token });
}

export async function getNotificationHistory(userId: number) {
  const { data } = await API.get(`/notifications/${userId}`);
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  await API.patch(`/notifications/${notificationId}/read`);
}

export async function getUnreadCount(userId: number) {
  const { data } = await API.get(`/notifications/${userId}/unread-count`);
  return data;
}