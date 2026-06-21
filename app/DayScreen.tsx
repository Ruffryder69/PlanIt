import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { getHolidays } from '../constants/holidays';
import { CATEGORIES } from '../constants/categories';
import { EventFormModal } from '../components/EventFormModal';

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WEEKDAYS_LONG = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
  return new Date(year, month - 1, day, hour, minute) < new Date();
}

export function DayScreen() {
  const theme = useAppTheme();
  const { accent, onAccent, textPrimary, textSecondary } = theme;
  const { events } = useEvents();
  const { bundesland } = useSettings();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const s = styles(theme);
  const holidays = getHolidays(parseDate(selectedDate).getFullYear(), bundesland);

  const allEvents = events
    .filter(e => e.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const allDayEvents = allEvents.filter(e => e.allDay);
  const dayEvents = allEvents.filter(e => !e.allDay);

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
          <Ionicons name="chevron-back" size={20} color={textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(toDateString(today))}>
          <Text style={s.dayTitle} numberOfLines={1}>{isToday ? 'Heute' : dateLabel}</Text>
          {!isToday && <Text style={s.daySubtitle}>{parsedDate.getDate()}. {MONTHS[parsedDate.getMonth()]}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(d => addDays(d, 1))} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Feiertag Banner */}
      {holidays[selectedDate] && (
        <View style={s.holidayBanner}>
          <Ionicons name="flag" size={13} color={theme.isDark ? '#EF9A9A' : '#C62828'} />
          <Text style={s.holidayText}>{holidays[selectedDate]}</Text>
        </View>
      )}

      {/* Ganztägige Termine */}
      {allDayEvents.length > 0 && (
        <View style={s.allDaySection}>
          {allDayEvents.map(ev => {
            const cat = CATEGORIES.find(c => c.id === ev.categoryId);
            return (
              <TouchableOpacity
                key={ev.id}
                style={[s.allDayPill, { backgroundColor: cat?.color ?? '#888' }]}
                onPress={() => { setEditEvent(ev); setModalVisible(true); }}
              >
                <Ionicons name="sunny-outline" size={12} color="#fff" />
                <Text style={s.allDayPillText} numberOfLines={1}>{ev.title}</Text>
              </TouchableOpacity>
            );
          })}
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
                  const images = ev.attachments?.filter(a => a.type === 'image') ?? [];
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
                      {ev.location ? (
                        <View style={s.metaRow}>
                          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
                          <Text style={[s.metaText, past && s.textPast]} numberOfLines={1}>{ev.location}</Text>
                        </View>
                      ) : null}
                      {ev.notes ? (
                        <Text style={[s.eventBlockNotes, past && s.textPast]} numberOfLines={1}>{ev.notes}</Text>
                      ) : null}
                      {images.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow}>
                          {images.map(img => (
                            <Image key={img.id} source={{ uri: img.uri }} style={s.thumb} />
                          ))}
                        </ScrollView>
                      )}
                      {(ev.attachments?.filter(a => a.type === 'document').length ?? 0) > 0 && (
                        <View style={s.metaRow}>
                          <Ionicons name="attach" size={11} color="rgba(255,255,255,0.8)" />
                          <Text style={s.metaText}>
                            {ev.attachments!.filter(a => a.type === 'document').length} Dokument
                            {ev.attachments!.filter(a => a.type === 'document').length > 1 ? 'e' : ''}
                          </Text>
                        </View>
                      )}
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
  dayNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  navBtn: { padding: 6 },
  dayTitle: { fontSize: 15, fontWeight: '500', color: textPrimary, textAlign: 'center', maxWidth: 220 },
  daySubtitle: { fontSize: 12, color: textSecondary, textAlign: 'center', marginTop: 1 },
  holidayBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 8,
    paddingVertical: 7, paddingHorizontal: 12,
    backgroundColor: isDark ? '#2D1515' : '#FEE8E8',
    borderRadius: 10,
    borderWidth: 0.5, borderColor: isDark ? '#5D2A2A' : '#F5BCBC',
  },
  holidayText: { fontSize: 12, fontWeight: '500', color: isDark ? '#EF9A9A' : '#C62828' },
  allDaySection: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  allDayPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  allDayPillText: { fontSize: 13, fontWeight: '500', color: '#fff' },
  timeline: { flex: 1, paddingHorizontal: 16 },
  timeRow: { flexDirection: 'row', minHeight: 56, marginBottom: 2 },
  timeLabel: { width: 44, fontSize: 11, color: textTertiary, paddingTop: 2, textAlign: 'right', paddingRight: 8 },
  timeContent: { flex: 1, position: 'relative', paddingLeft: 8 },
  timeLine: { position: 'absolute', top: 8, left: 8, right: 0, height: 0.5, backgroundColor: border },
  eventBlock: { borderRadius: 10, padding: 10, marginBottom: 4, marginTop: 2 },
  eventBlockPast: { opacity: 0.5 },
  eventBlockTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  eventBlockTime: { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.8)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', flex: 1 },
  eventBlockNotes: { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' },
  textPast: { textDecorationLine: 'line-through' },
  thumbRow: { marginTop: 6 },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 6 },
  fab: {
    position: 'absolute', bottom: 48, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
