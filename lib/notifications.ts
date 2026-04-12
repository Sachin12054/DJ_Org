import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DJEvent } from '../types/Event';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleEventReminder(event: DJEvent): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const reminderTime = new Date(event.reminderDate);
    if (reminderTime <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎧 ${event.eventName}`,
        body: `Reminder: Event with ${event.clientName} — ${new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        data: { eventId: event.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
    return id;
  } catch (e) {
    console.warn('Could not schedule notification', e);
    return null;
  }
}

export async function schedulePaymentReminder(event: DJEvent): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (event.remainingAmount <= 0) return null;
  try {
    const eventDate = new Date(event.eventDate);
    const reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
    if (reminderTime <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 Payment Pending — ${event.eventName}`,
        body: `₹${event.remainingAmount.toLocaleString('en-IN')} due from ${event.clientName}. Event is tomorrow!`,
        data: { eventId: event.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
    return id;
  } catch (e) {
    console.warn('Could not schedule payment reminder', e);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
