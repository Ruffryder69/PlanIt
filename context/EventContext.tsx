import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { scheduleEventNotification, cancelEventNotification } from '../hooks/useNotifications';

export type Reminder = '15min' | '1h' | '1day' | 'none';

export type Attachment = {
  id: string;
  uri: string;
  type: 'image' | 'document';
  name: string;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  allDay?: boolean;
  startTime: string;
  endTime: string;
  categoryId: string;
  reminder: Reminder;
  notes?: string;
  location?: string;
  attachments?: Attachment[];
  seriesId?: string;
};

type EventContextType = {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  addEvents: (events: Omit<Event, 'id'>[]) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  deleteEventSeries: (seriesId: string) => Promise<void>;
};

const EventContext = createContext<EventContextType | null>(null);
const STORAGE_KEY = 'planit_events';
const ATTACHMENTS_DIR = (FileSystem.documentDirectory ?? '') + 'attachments/';

async function ensureAttachmentsDir() {
  const info = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
}

async function deleteAttachmentFiles(attachments?: Attachment[]) {
  if (!attachments?.length) return;
  for (const a of attachments) {
    try { await FileSystem.deleteAsync(a.uri, { idempotent: true }); } catch {}
  }
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    ensureAttachmentsDir().catch(() => {});
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch (e) {
      console.error('Fehler beim Laden:', e);
    }
  };

  const saveEvents = async (updated: Event[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setEvents(updated);
    } catch (e) {
      console.error('Fehler beim Speichern:', e);
    }
  };

  const addEvent = async (event: Omit<Event, 'id'>) => {
    const newEvent: Event = { ...event, id: Date.now().toString() };
    await saveEvents([...events, newEvent]);
    await scheduleEventNotification(newEvent);
  };

  const addEvents = async (newEvents: Omit<Event, 'id'>[]) => {
    const created: Event[] = newEvents.map((e, i) => ({
      ...e,
      id: `${Date.now()}_${i}`,
    }));
    await saveEvents([...events, ...created]);
    for (const ev of created) {
      await scheduleEventNotification(ev);
    }
  };

  const updateEvent = async (updated: Event) => {
    const newList = events.map(e => e.id === updated.id ? updated : e);
    await saveEvents(newList);
    await scheduleEventNotification(updated);
  };

  const deleteEvent = async (id: string) => {
    const ev = events.find(e => e.id === id);
    await deleteAttachmentFiles(ev?.attachments);
    const newList = events.filter(e => e.id !== id);
    await saveEvents(newList);
    await cancelEventNotification(id);
  };

  const deleteEventSeries = async (seriesId: string) => {
    const toDelete = events.filter(e => e.seriesId === seriesId);
    for (const ev of toDelete) {
      await deleteAttachmentFiles(ev.attachments);
      await cancelEventNotification(ev.id);
    }
    const newList = events.filter(e => e.seriesId !== seriesId);
    await saveEvents(newList);
  };

  return (
    <EventContext.Provider value={{ events, addEvent, addEvents, updateEvent, deleteEvent, deleteEventSeries }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}

export { ATTACHMENTS_DIR };
