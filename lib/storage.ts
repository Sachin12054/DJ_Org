import AsyncStorage from '@react-native-async-storage/async-storage';
import { DJEvent } from '../types/Event';

const EVENTS_KEY = '@dj_events_v1';
const SETTINGS_KEY = '@dj_settings_v1';

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getStoredEvents(): Promise<DJEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveStoredEvents(events: DJEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events', e);
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  notificationsEnabled: boolean;
  paymentReminders: boolean;
  morningReminders: boolean;
  currency: string;
}

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  paymentReminders: true,
  morningReminders: true,
  currency: '₹',
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getAppSettings();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportEventsAsJSON(): Promise<string> {
  const events = await getStoredEvents();
  return JSON.stringify(events, null, 2);
}
