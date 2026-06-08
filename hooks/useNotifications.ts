import { Event } from '../context/EventContext';

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleEventNotification(event: Event): Promise<void> {
  // Notifications temporarily disabled
}

export async function cancelEventNotification(eventId: string): Promise<void> {
  // Notifications temporarily disabled
}

export function useNotifications() {
  // Notifications temporarily disabled
}