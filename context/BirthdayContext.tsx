import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, TriggerType, AlarmType } from '@notifee/react-native';

export type BirthdayReminder = 'none' | '1day' | '1week';

export type Birthday = {
  id: string;
  name: string;
  day: number;
  month: number;
  year?: number;
  notes?: string;
  reminder: BirthdayReminder;
};

export function nextBirthdayDate(day: number, month: number): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  thisYear.setHours(0, 0, 0, 0);
  if (thisYear >= now) return thisYear;
  return new Date(now.getFullYear() + 1, month - 1, day);
}

export function daysUntil(day: number, month: number): number {
  const next = nextBirthdayDate(day, month);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((next.getTime() - now.getTime()) / 86400000);
}

export function ageThisYear(year: number, month: number, day: number): number {
  const today = new Date();
  const age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  return hasBirthdayPassed ? age : age - 1;
}

const AVATAR_COLORS = ['#FF6B6B', '#FF8E53', '#FFA502', '#26de81', '#45aaf2', '#a55eea', '#fd9644', '#2bcbba'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

async function scheduleBirthdayNotification(b: Birthday) {
  try {
    await notifee.cancelNotification(`birthday-${b.id}`);
    if (b.reminder === 'none') return;

    const next = nextBirthdayDate(b.day, b.month);
    const offsetDays = b.reminder === '1week' ? 7 : 1;
    const triggerDate = new Date(next);
    triggerDate.setDate(triggerDate.getDate() - offsetDays);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate <= new Date()) return;

    const channelId = await notifee.createChannel({
      id: 'planit-birthday',
      name: 'Geburtstage',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    const label = b.reminder === '1week' ? 'in einer Woche' : 'morgen';
    await notifee.createTriggerNotification(
      {
        id: `birthday-${b.id}`,
        title: `${b.name} hat bald Geburtstag`,
        body: `${b.name} feiert ${label} Geburtstag (${String(b.day).padStart(2, '0')}.${String(b.month).padStart(2, '0')})`,
        android: { channelId, sound: 'default', importance: AndroidImportance.HIGH },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
      }
    );
  } catch (e) {
    console.log('Birthday notification error:', e);
  }
}

type BirthdayContextType = {
  birthdays: Birthday[];
  addBirthday: (b: Omit<Birthday, 'id'>) => Promise<void>;
  updateBirthday: (b: Birthday) => Promise<void>;
  deleteBirthday: (id: string) => Promise<void>;
};

const BirthdayContext = createContext<BirthdayContextType | null>(null);
const STORAGE_KEY = 'planit_birthdays';

export function BirthdayProvider({ children }: { children: React.ReactNode }) {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: Birthday[] = JSON.parse(raw);
        setBirthdays(list);
        for (const b of list) scheduleBirthdayNotification(b);
      }
    } catch {}
  };

  const save = async (list: Birthday[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setBirthdays(list);
  };

  const addBirthday = async (b: Omit<Birthday, 'id'>) => {
    const newB: Birthday = { ...b, id: Date.now().toString() };
    const updated = [...birthdays, newB];
    await save(updated);
    scheduleBirthdayNotification(newB);
  };

  const updateBirthday = async (b: Birthday) => {
    const updated = birthdays.map(x => x.id === b.id ? b : x);
    await save(updated);
    scheduleBirthdayNotification(b);
  };

  const deleteBirthday = async (id: string) => {
    await notifee.cancelNotification(`birthday-${id}`);
    await save(birthdays.filter(b => b.id !== id));
  };

  return (
    <BirthdayContext.Provider value={{ birthdays, addBirthday, updateBirthday, deleteBirthday }}>
      {children}
    </BirthdayContext.Provider>
  );
}

export function useBirthdays() {
  const ctx = useContext(BirthdayContext);
  if (!ctx) throw new Error('useBirthdays must be used within BirthdayProvider');
  return ctx;
}
