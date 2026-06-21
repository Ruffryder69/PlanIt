import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
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
  return new Date(year, month - 1, day, hour, minute) < new Date();
}

type Props = { initialYear?: number; initialMonth?: number };

export function MonthScreen({ initialYear, initialMonth }: Props) {
  const theme = useAppTheme();
  const { isDark, accent, onAccent, textPrimary, textSecondary, textTertiary } = theme;
  const { events } = useEvents();
  const { bundesland } = useSettings();
  const today = new Date();

  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());

  useEffect(() => {
    if (initialYear !== undefined) setYear(initialYear);
    if (initialMonth !== undefined) setMonth(initialMonth);
  }, [initialYear, initialMonth]);
  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const s = styles(theme);
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
          <Ionicons name="chevron-back" size={20} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={textPrimary} />
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
                isHoliday && !isToday && !isSelected && (isDark ? s.holidayBgDark : s.holidayBg),
                isSelected && !isToday && s.selectedBg,
                isToday && { backgroundColor: accent },
              ]}>
                <Text style={[
                  s.dayNum,
                  isToday && { color: onAccent, fontWeight: '600' },
                  isSelected && !isToday && { fontWeight: '600', color: accent },
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
        <View style={s.dayLabelRow}>
          <Text style={s.dayLabel}>
            {selectedDate === toDateString(today) ? 'Heute' : selectedDate.split('-').reverse().join('.')}
          </Text>
          {holidays[selectedDate] ? (
            <View style={s.holidayTag}>
              <Ionicons name="flag" size={10} color={isDark ? '#EF9A9A' : '#C62828'} />
              <Text style={s.holidayTagText}>{holidays[selectedDate]}</Text>
            </View>
          ) : null}
        </View>

        {selectedEvents.length === 0 ? (
          <Text style={s.noEvents}>Keine Termine</Text>
        ) : (
          selectedEvents.map(ev => {
            const cat = CATEGORIES.find(c => c.id === ev.categoryId);
            const count = categoryCount(ev.categoryId);
            const past = isPast(ev);
            const hasAttachments = (ev.attachments?.length ?? 0) > 0;
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
                  <Text style={[s.eventTime, past && s.textPast]}>
                    {ev.allDay ? 'Ganztägig' : `${ev.startTime} – ${ev.endTime}`}
                  </Text>
                  {ev.location ? (
                    <View style={s.metaRow}>
                      <Ionicons name="location-outline" size={11} color={textTertiary} />
                      <Text style={[s.metaText, past && s.textPast]} numberOfLines={1}>{ev.location}</Text>
                    </View>
                  ) : null}
                  {ev.notes ? (
                    <Text style={[s.eventNotes, past && s.textPast]} numberOfLines={1}>{ev.notes}</Text>
                  ) : null}
                </View>
                <View style={s.pillRight}>
                  {hasAttachments && (
                    <Ionicons name="attach" size={14} color={textTertiary} style={{ marginRight: 4 }} />
                  )}
                  <Ionicons name="chevron-forward" size={16} color={textTertiary} />
                </View>
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
        <Ionicons name="add" size={28} color={onAccent} />
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

const styles = ({ isDark, accent, onAccent, bg, surface, surfaceElevated, textPrimary, textSecondary, textTertiary, border }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: 16, fontWeight: '500', color: textPrimary },
  weekdays: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', color: textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 2 },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  holidayBg: { backgroundColor: '#FEE8E8' },
  holidayBgDark: { backgroundColor: '#2D1515' },
  selectedBg: { borderWidth: 1.5, borderColor: accent },
  dayNum: { fontSize: 13, color: textPrimary },
  holidayText: { color: isDark ? '#EF9A9A' : '#C62828' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  divider: { height: 0.5, backgroundColor: border, marginHorizontal: 16, marginVertical: 8 },
  eventList: { flex: 1, paddingHorizontal: 16 },
  dayLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dayLabel: { fontSize: 11, fontWeight: '500', color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  holidayTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: isDark ? '#2D1515' : '#FEE8E8',
  },
  holidayTagText: { fontSize: 11, fontWeight: '600', color: isDark ? '#EF9A9A' : '#C62828' },
  noEvents: { fontSize: 14, color: textTertiary, textAlign: 'center', marginTop: 24 },
  eventPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 20, marginBottom: 8,
    borderWidth: 0.5, borderColor: border,
    backgroundColor: surface,
  },
  eventPillPast: { opacity: 0.6 },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeNum: { fontSize: 14, fontWeight: '600', color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '500', color: textPrimary },
  eventTime: { fontSize: 12, color: textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11, color: textTertiary, flex: 1 },
  eventNotes: { fontSize: 12, color: textTertiary, marginTop: 2, fontStyle: 'italic' },
  textPast: { textDecorationLine: 'line-through', color: textTertiary },
  pillRight: { flexDirection: 'row', alignItems: 'center' },
  fab: {
    position: 'absolute', bottom: 48, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
