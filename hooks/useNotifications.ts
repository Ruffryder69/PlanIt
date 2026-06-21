import { useEffect } from 'react';
import notifee, { AndroidImportance, TriggerType, AlarmType } from '@notifee/react-native';
import { Event, Reminder } from '../context/EventContext';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await notifee.requestPermission();
    return true;
  } catch (e) {
    console.log('Notification permission error:', e);
    return false;
  }
}

async function ensureChannel(): Promise<string> {
  return await notifee.createChannel({
    id: 'planit',
    name: 'PlanIt Erinnerungen',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function scheduleEventNotification(event: Event): Promise<void> {
  try {
    if (event.reminder === 'none') return;
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
    if (triggerDate <= new Date()) return;

    const reminderLabel: Record<Reminder, string> = {
      '15min': '15 Minuten',
      '1h': '1 Stunde',
      '1day': '1 Tag',
      'none': '',
    };

    const channelId = await ensureChannel();

    await notifee.createTriggerNotification(
      {
        id: `event-${event.id}`,
        title: event.title,
        body: `Beginnt in ${reminderLabel[event.reminder]} um ${event.startTime} Uhr`,
        android: {
          channelId,
          sound: 'default',
          importance: AndroidImportance.HIGH,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        alarmManager: {
          type: AlarmType.SET_ALARM_CLOCK,
        },
      }
    );
  } catch (e) {
    console.log('Schedule notification error:', e);
  }
}

export async function cancelEventNotification(eventId: string): Promise<void> {
  try {
    await notifee.cancelNotification(`event-${eventId}`);
  } catch (e) {
    console.log('Cancel notification error:', e);
  }
}

export function useNotifications() {
  useEffect(() => {
    requestNotificationPermission();
  }, []);
}