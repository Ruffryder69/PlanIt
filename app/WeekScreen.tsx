import React, { useState } from 'react';
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

const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function WeekScreen() {
  const theme = useAppTheme();
  const { accent, onAccent, textPrimary, textSecondary } = theme;
  const { events } = useEvents();
  const { bundesland } = useSettings();
  const today = new Date();

  const [weekStart, setWeekStart] = useState(getMonday(today));
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState(toDateString(today));

  const s = styles(theme);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const holidays = getHolidays(weekStart.getFullYear(), bundesland);

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const weekLabel = () => {
    const from = weekDays[0];
    const to = weekDays[6];
    const kw = getWeekNumber(from);
    if (from.getMonth() === to.getMonth()) {
      return `KW ${kw}  ·  ${from.getDate()}. – ${to.getDate()}. ${MONTHS_SHORT[from.getMonth()]} ${from.getFullYear()}`;
    }
    return `KW ${kw}  ·  ${from.getDate()}. ${MONTHS_SHORT[from.getMonth()]} – ${to.getDate()}. ${MONTHS_SHORT[to.getMonth()]} ${to.getFullYear()}`;
  };

  const eventsForCell = (dateStr: string, hour: number) =>
    events.filter(e => {
      if (e.date !== dateStr) return false;
      const h = parseInt(e.startTime.split(':')[0]);
      return h === hour;
    });

  return (
    <View style={s.container}>
      {/* Woche Navigation */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={() => setWeekStart(d => addWeeks(d, -1))} style={s.navBtn}>
          <Ionicons name="chevron-back" size={20} color={textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setWeekStart(getMonday(today))}>
          <Text style={s.weekTitle}>{weekLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setWeekStart(d => addWeeks(d, 1))} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Wochentage Header */}
      <View style={s.dayHeader}>
        <View style={s.timeGutter} />
        {weekDays.map((d, i) => {
          const dateStr = toDateString(d);
          const isToday = dateStr === toDateString(today);
          const isSelected = dateStr === selectedDate;
          const isHoliday = !!holidays[dateStr];
          return (
            <TouchableOpacity
              key={i}
              style={s.dayHeaderCell}
              onPress={() => setSelectedDate(dateStr)}
            >
              <Text style={[s.dayHeaderWeekday, isHoliday && s.holidayLabel]}>
                {WEEKDAYS_SHORT[i]}
              </Text>
              <View style={[
                s.dayHeaderNum,
                isToday && s.todayCircle,
                isSelected && !isToday && s.selectedCircle,
              ]}>
                <Text style={[
                  s.dayHeaderNumText,
                  isToday && s.todayText,
                  isSelected && !isToday && s.selectedText,
                ]}>
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Zeitstrahl Grid */}
      <ScrollView style={s.grid} contentContainerStyle={{ paddingBottom: 100 }}>
        {HOURS.map(hour => (
          <View key={hour} style={s.hourRow}>
            <Text style={s.hourLabel}>{String(hour).padStart(2,'0')}:00</Text>
            {weekDays.map((d, i) => {
              const dateStr = toDateString(d);
              const cellEvents = eventsForCell(dateStr, hour);
              return (
                <View key={i} style={s.cell}>
                  <View style={s.cellLine} />
                  {cellEvents.map(ev => {
                    const cat = CATEGORIES.find(c => c.id === ev.categoryId);
                    return (
                      <TouchableOpacity
                        key={ev.id}
                        style={[s.cellEvent, { backgroundColor: cat?.color ?? '#888' }]}
                        onPress={() => { setEditEvent(ev); setModalVisible(true); }}
                      >
                        <Text style={s.cellEventText} numberOfLines={1}>{ev.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ))}
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

const styles = ({ isDark, accent, onAccent, bg, surface, textPrimary, textSecondary, textTertiary, border }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  navBtn: { padding: 6 },
  weekTitle: { fontSize: 14, fontWeight: '500', color: textPrimary, textAlign: 'center' },
  dayHeader: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: border },
  timeGutter: { width: 44 },
  dayHeaderCell: { flex: 1, alignItems: 'center' },
  dayHeaderWeekday: { fontSize: 10, fontWeight: '500', color: textSecondary, marginBottom: 3 },
  holidayLabel: { color: isDark ? '#EF9A9A' : '#C62828' },
  dayHeaderNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: accent },
  selectedCircle: { borderWidth: 1.5, borderColor: accent },
  dayHeaderNumText: { fontSize: 13, color: textPrimary },
  todayText: { color: onAccent, fontWeight: '600' },
  selectedText: { fontWeight: '600', color: accent },
  grid: { flex: 1, paddingHorizontal: 8 },
  hourRow: { flexDirection: 'row', minHeight: 52 },
  hourLabel: { width: 44, fontSize: 10, color: textTertiary, paddingTop: 2, textAlign: 'right', paddingRight: 6 },
  cell: { flex: 1, borderLeftWidth: 0.5, borderLeftColor: border, paddingLeft: 2 },
  cellLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 0.5, backgroundColor: border },
  cellEvent: {
    borderLeftWidth: 2, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 3, marginBottom: 2, marginTop: 1,
  },
  cellEventText: { fontSize: 9, fontWeight: '600', color: '#fff' },
  fab: {
    position: 'absolute', bottom: 48, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
