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

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function isPast(ev: Event): boolean {
  const [year, month, day] = ev.date.split('-').map(Number);
  const [hour, minute] = ev.endTime.split(':').map(Number);
  const endDate = new Date(year, month - 1, day, hour, minute);
  return endDate < new Date();
}

export function MonthScreen() {
  const isDark = useColorScheme() === 'dark';
  const { events } = useEvents();
  const { bundesland } = useSettings();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const s = styles(isDark);
  const holidays = getHolidays(year, bundesland);

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const eventsForDate = (dateStr: string) =>
    events
      .filter(e => e.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const categoryCount = (catId: string) =>
    events.filter(e => e.categoryId === catId).length;

  const selectedEvents = eventsForDate(selectedDate);

  return (
    <View style={s.container}>

      {/* Monat Navigation */}
      <View style={s.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
          <Ionicons name="chevron-back" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      {/* Wochentage */}
      <View style={s.weekdays}>
        {WEEKDAYS.map(d => (
          <Text key={d} style={s.weekday}>{d}</Text>
        ))}
      </View>

      {/* Kalender Grid */}
      <View style={s.grid}>
        {Array.from({ length: offset }).map((_, i) => (
          <View key={`empty-${i}`} style={s.dayCell} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday = dateStr === toDateString(today);
          const isSelected = dateStr === selectedDate;
          const isHoliday = !!holidays[dateStr];
          const dayEvents = eventsForDate(dateStr);

          return (
            <TouchableOpacity
              key={dateStr}
              style={s.dayCell}
              onPress={() => setSelectedDate(dateStr)}
            >
              <View style={[
                s.dayInner,
                isHoliday && !isToday && !isSelected && s.holidayBg,
                isSelected && !isToday && s.selectedBg,
                isToday && s.todayBg,
              ]}>
                <Text style={[
                  s.dayNum,
                  isToday && s.todayText,
                  isSelected && !isToday && s.selectedText,
                  isHoliday && !isToday && !isSelected && s.holidayText,
                ]}>
                  {day}
                </Text>
              </View>
              <View style={s.dots}>
                {dayEvents.slice(0, 3).map(ev => {
                  const cat = CATEGORIES.find(c => c.id === ev.categoryId);
                  return (
                    <View
                      key={ev.id}
                      style={[s.dot, { backgroundColor: cat?.color ?? '#888' }]}
                    />
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.divider} />

      {/* Termine des gewählten Tages */}
      <ScrollView style={s.eventList} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={s.dayLabel}>
          {selectedDate === toDateString(today) ? 'Heute' : selectedDate.split('-').reverse().join('.')}
          {holidays[selectedDate] ? `  ·  ${holidays[selectedDate]}` : ''}
        </Text>

        {selectedEvents.length === 0 ? (
          <Text style={s.noEvents}>Keine Termine</Text>
        ) : (
          selectedEvents.map(ev => {
            const cat = CATEGORIES.find(c => c.id === ev.categoryId);
            const count = categoryCount(ev.categoryId);
            const past = isPast(ev);
            return (
              <TouchableOpacity
                key={ev.id}
                style={[s.eventPill, past && s.eventPillPast]}
                onPress={() => { setEditEvent(ev); setModalVisible(true); }}
              >
                <View style={[s.badge, { backgroundColor: cat?.color ?? '#888', opacity: past ? 0.5 : 1 }]}>
                  <Text style={s.badgeNum}>{count}</Text>
                </View>
                <View style={s.eventInfo}>
                  <Text style={[s.eventName, past && s.textPast]}>{ev.title}</Text>
                  <Text style={[s.eventTime, past && s.textPast]}>{ev.startTime} – {ev.endTime}</Text>
                  {ev.notes ? (
                    <Text style={[s.eventNotes, past && s.textPast]} numberOfLines={1}>{ev.notes}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#ccc'} />
              </TouchableOpacity>
            );
          })
        )}
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
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: 16, fontWeight: '500', color: isDark ? '#fff' : '#1a1a1a' },
  weekdays: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', color: isDark ? '#666' : '#aaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 2 },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  holidayBg: { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' },
  selectedBg: { borderWidth: 1.5, borderColor: isDark ? '#fff' : '#1a1a1a' },
  todayBg: { backgroundColor: isDark ? '#fff' : '#1a1a1a' },
  dayNum: { fontSize: 13, color: isDark ? '#ccc' : '#1a1a1a' },
  todayText: { color: isDark ? '#1a1a1a' : '#fff', fontWeight: '600' },
  selectedText: { fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a' },
  holidayText: { color: isDark ? '#666' : '#bbb' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  divider: { height: 0.5, backgroundColor: isDark ? '#333' : '#e5e5e5', marginHorizontal: 16, marginVertical: 8 },
  eventList: { flex: 1, paddingHorizontal: 16 },
  dayLabel: { fontSize: 11, fontWeight: '500', color: isDark ? '#666' : '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  noEvents: { fontSize: 14, color: isDark ? '#555' : '#bbb', textAlign: 'center', marginTop: 24 },
  eventPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 20, marginBottom: 8,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e5e5e5',
    backgroundColor: isDark ? '#242424' : '#fff',
  },
  eventPillPast: { opacity: 0.6 },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeNum: { fontSize: 14, fontWeight: '600', color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '500', color: isDark ? '#fff' : '#1a1a1a' },
  eventTime: { fontSize: 12, color: isDark ? '#888' : '#999', marginTop: 1 },
  eventNotes: { fontSize: 12, color: isDark ? '#666' : '#bbb', marginTop: 2, fontStyle: 'italic' },
  textPast: { textDecorationLine: 'line-through', color: isDark ? '#555' : '#bbb' },
  fab: {
    position: 'absolute', bottom: 48, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: isDark ? '#fff' : '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
  },
});