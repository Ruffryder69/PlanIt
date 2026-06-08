import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Event, Reminder } from '../context/EventContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleEventNotification(event: Event): Promise<void> {
  if (event.reminder === 'none') return;

  // Alte Notification für dieses Event canceln
  await cancelEventNotification(event.id);

  const [year, month, day] = event.date.split('-').map(Number);
  const [hour, minute] = event.startTime.split(':').map(Number);

  const eventDate = new Date(year, month - 1, day, hour, minute, 0);

  const offsetMinutes: Record<Reminder, number> = {
    '15min': 15,
    '1h': 60,
    '1day': 60 * 24,
    'none': 0,
  };

  const triggerDate = new Date(eventDate.getTime() - offsetMinutes[event.reminder] * 60 * 1000);

  if (triggerDate <= new Date()) return; // Zeitpunkt liegt in der Vergangenheit

  const reminderLabel: Record<Reminder, string> = {
    '15min': '15 Minuten',
    '1h': '1 Stunde',
    '1day': '1 Tag',
    'none': '',
  };

  await Notifications.scheduleNotificationAsync({
    identifier: `event-${event.id}`,
    content: {
      title: event.title,
      body: `Beginnt in ${reminderLabel[event.reminder]} um ${event.startTime} Uhr`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelEventNotification(eventId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`event-${eventId}`);
}

export function useNotifications() {
  useEffect(() => {
    requestNotificationPermission();

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }, []);
}