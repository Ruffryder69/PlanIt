import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleEventNotification, cancelEventNotification } from '../hooks/useNotifications';

export type Reminder = '15min' | '1h' | '1day' | 'none';

export type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  categoryId: string;
  reminder: Reminder;
  notes?: string;
};

type EventContextType = {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};

const EventContext = createContext<EventContextType | null>(null);
const STORAGE_KEY = 'planit_events';

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
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

  const updateEvent = async (updated: Event) => {
    const newList = events.map(e => e.id === updated.id ? updated : e);
    await saveEvents(newList);
    await scheduleEventNotification(updated);
  };

  const deleteEvent = async (id: string) => {
    const newList = events.filter(e => e.id !== id);
    await saveEvents(newList);
    await cancelEventNotification(id);
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}