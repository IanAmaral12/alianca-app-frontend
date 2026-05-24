import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let notificationsReady = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function prepareNotifications() {
  if (notificationsReady || Platform.OS === 'web') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tasks', {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#EA6F5A',
      name: 'Tarefas do casal',
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  const permissions = await Notifications.getPermissionsAsync();

  if (!permissions.granted) {
    await Notifications.requestPermissionsAsync();
  }

  notificationsReady = true;
}

export async function notifyPartnerTask(title: string, body: string) {
  if (Platform.OS === 'web') {
    return;
  }

  await prepareNotifications();

  await Notifications.scheduleNotificationAsync({
    content: {
      body,
      title,
    },
    trigger: null,
  });
}