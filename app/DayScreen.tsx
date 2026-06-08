import React, { useState } from 'react';
import {
  View, Text, StyleSheet, useColorScheme,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';
import { getHolidays } from '../constants/holidays';
import { CATEGORIES } from '../constants/categories';
import { EventFormModal } from '../components/EventFormModal';

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WEEKDAYS_LONG = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isPast(ev: Event): boolean {
  const [year, month, day] = ev.date.split('-').map(Number);
  const [hour, minute] = ev.endTime.split(':').map(Number);
  const endDate = new Date(year, month - 1, day, hour, minute);
  return endDate < new Date();
}

export function DayScreen() {
  const isDark = useColorScheme() === 'dark';
  const { events } = useEvents();
  const { bundesland } = useSettings();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const s = styles(isDark);
  const holidays = getHolidays(parseDate(selectedDate).getFullYear(), bundesland);

  const dayEvents = events
    .filter(e => e.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const parsedDate = parseDate(selectedDate);
  const isToday = selectedDate === toDateString(today);
  const dateLabel = `${WEEKDAYS_LONG[parsedDate.getDay()]}, ${parsedDate.getDate()}. ${MONTHS[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;

  const eventsForHour = (hour: number) =>
    dayEvents.filter(ev => parseInt(ev.startTime.split(':')[0]) === hour);

  return (
    <View style={s.container}>

      {/* Tag Navigation */}
      <View style={s.dayNav}>
        <TouchableOpacity onPress={() => setSelectedDate(d => addDays(d, -1))} style={s.navBtn}>
          <Ionicons name="chevron-back" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(toDateString(today))}>
          <Text style={s.dayTitle} numberOfLines={1}>{isToday ? 'Heute' : dateLabel}</Text>
          {!isToday && <Text style={s.daySubtitle}>{parsedDate.getDate()}. {MONTHS[parsedDate.getMonth()]}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(d => addDays(d, 1))} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      {/* Feiertag Banner */}
      {holidays[selectedDate] && (
        <View style={s.holidayBanner}>
          <Ionicons name="flag-outline" size={13} color={isDark ? '#888' : '#aaa'} />
          <Text style={s.holidayText}>{holidays[selectedDate]}</Text>
        </View>
      )}

      {/* Zeitstrahl */}
      <ScrollView style={s.timeline} contentContainerStyle={{ paddingBottom: 100 }}>
        {HOURS.map(hour => {
          const hourEvents = eventsForHour(hour);
          return (
            <View key={hour} style={s.timeRow}>
              <Text style={s.timeLabel}>{String(hour).padStart(2,'0')}:00</Text>
              <View style={s.timeContent}>
                <View style={s.timeLine} />
                {hourEvents.map(ev => {
                  const cat = CATEGORIES.find(c => c.id === ev.categoryId);
                  const past = isPast(ev);
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      style={[
                        s.eventBlock,
                        { backgroundColor: cat?.color ?? '#888' },
                        past && s.eventBlockPast,
                      ]}
                      onPress={() => { setEditEvent(ev); setModalVisible(true); }}
                    >
                      <Text style={[s.eventBlockTitle, past && s.textPast]} numberOfLines={1}>
                        {ev.title}
                      </Text>
                      <Text style={[s.eventBlockTime, past && s.textPast]}>
                        {ev.startTime} – {ev.endTime}
                      </Text>
                      {ev.notes ? (
                        <Text style={[s.eventBlockNotes, past && s.textPast]} numberOfLines={1}>
                          {ev.notes}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => { setEditEvent(null); setModalVisible(true); }}
      >
        <Ionicons name="add" size={28} color={isDark ? '#1a1a1a' : '#fff'} />
      </TouchableOpacity>

      <EventFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editEvent={editEvent}
        defaultDate={selectedDate}
      />

    </View>
  );
}

const styles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' },
  dayNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  navBtn: { padding: 6 },
  dayTitle: { fontSize: 15, fontWeight: '500', color: isDark ? '#fff' : '#1a1a1a', textAlign: 'center', maxWidth: 220 },
  daySubtitle: { fontSize: 12, color: isDark ? '#666' : '#aaa', textAlign: 'center', marginTop: 1 },
  holidayBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 8,
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 10,
  },
  holidayText: { fontSize: 12, color: isDark ? '#888' : '#aaa' },
  timeline: { flex: 1, paddingHorizontal: 16 },
  timeRow: { flexDirection: 'row', minHeight: 56, marginBottom: 2 },
  timeLabel: { width: 44, fontSize: 11, color: isDark ? '#555' : '#bbb', paddingTop: 2, textAlign: 'right', paddingRight: 8 },
  timeContent: { flex: 1, position: 'relative', paddingLeft: 8 },
  timeLine: { position: 'absolute', top: 8, left: 8, right: 0, height: 0.5, backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' },
  eventBlock: { borderRadius: 10, padding: 10, marginBottom: 4, marginTop: 2 },
  eventBlockPast: { opacity: 0.5 },
  eventBlockTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  eventBlockTime: { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.8)' },
  eventBlockNotes: { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' },
  textPast: { textDecorationLine: 'line-through' },
  fab: {
    position: 'absolute', bottom: 48, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: isDark ? '#fff' : '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
  },
});