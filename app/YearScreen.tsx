import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { getHolidays } from '../constants/holidays';
import { CATEGORIES } from '../constants/categories';

const MONTHS_LONG = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember',
];
const WEEKDAYS = ['M','D','M','D','F','S','S'];

function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

type Props = { onMonthPress?: (year: number, month: number) => void };

export function YearScreen({ onMonthPress }: Props) {
  const theme = useAppTheme();
  const { accent, onAccent, textPrimary } = theme;
  const { events } = useEvents();
  const { bundesland } = useSettings();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());

  const s = styles(theme);
  const holidays = getHolidays(year, bundesland);
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const { width } = Dimensions.get('window');
  const OUTER_PAD = 16;
  const GAP = 12;
  const monthWidth = (width - OUTER_PAD * 2 - GAP) / 2;
  const cellSize = Math.floor(monthWidth / 7);

  const eventsOnDate = (dateStr: string) =>
    events.filter(e => e.date === dateStr);

  return (
    <View style={s.container}>
      {/* Jahres-Navigation */}
      <View style={s.yearNav}>
        <TouchableOpacity onPress={() => setYear(y => y - 1)} style={s.navBtn}>
          <Ionicons name="chevron-back" size={20} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.yearTitle}>{year}</Text>
        <TouchableOpacity onPress={() => setYear(y => y + 1)} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.grid, { paddingHorizontal: OUTER_PAD }]}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const firstDow = new Date(year, monthIdx, 1).getDay();
          const offset = firstDow === 0 ? 6 : firstDow - 1;
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

          return (
            <TouchableOpacity
              key={monthIdx}
              style={[s.monthCard, { width: monthWidth }]}
              onPress={() => onMonthPress?.(year, monthIdx)}
              activeOpacity={0.7}
            >
              <Text style={s.monthTitle}>{MONTHS_LONG[monthIdx]}</Text>

              <View style={s.wdRow}>
                {WEEKDAYS.map((d, i) => (
                  <Text key={i} style={[s.wdLabel, { width: cellSize }]}>{d}</Text>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: offset }, (_, i) => (
                  <View key={`e${i}`} style={{ width: cellSize, height: cellSize + 5 }} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = toDateString(year, monthIdx, day);
                  const isToday = dateStr === todayStr;
                  const isHoliday = !!holidays[dateStr];
                  const dotColors = eventsOnDate(dateStr)
                    .slice(0, 2)
                    .map(ev => CATEGORIES.find(c => c.id === ev.categoryId)?.color ?? '#888');

                  return (
                    <View key={dateStr} style={[s.dayCell, { width: cellSize }]}>
                      <View style={[
                        s.dayInner,
                        { width: cellSize - 2, height: cellSize - 2 },
                        isHoliday && !isToday && s.holidayBg,
                        isToday && { backgroundColor: accent },
                      ]}>
                        <Text style={[
                          s.dayNum,
                          isToday && { color: onAccent, fontWeight: '700' },
                          isHoliday && !isToday && s.holidayText,
                        ]}>
                          {day}
                        </Text>
                      </View>
                      {dotColors.length > 0 && (
                        <View style={s.dotRow}>
                          {dotColors.map((color, idx) => (
                            <View key={idx} style={[s.dot, { backgroundColor: color }]} />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = ({ isDark, accent, onAccent, bg, surface, surfaceElevated, textPrimary, textSecondary, textTertiary, border }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  yearNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  navBtn: { padding: 6 },
  yearTitle: { fontSize: 16, fontWeight: '500', color: textPrimary },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingBottom: 32,
  },
  monthCard: {
    paddingVertical: 10, paddingHorizontal: 4,
    backgroundColor: surface,
    borderRadius: 12,
    borderWidth: 0.5, borderColor: border,
  },
  monthTitle: {
    fontSize: 11, fontWeight: '600',
    color: textPrimary,
    textAlign: 'center', marginBottom: 6, letterSpacing: 0.3,
  },
  wdRow: { flexDirection: 'row', marginBottom: 2 },
  wdLabel: { fontSize: 8, fontWeight: '500', color: textTertiary, textAlign: 'center' },
  dayCell: { alignItems: 'center', marginBottom: 1 },
  dayInner: { borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  holidayBg: { backgroundColor: isDark ? '#2D1515' : '#FEE8E8' },
  dayNum: { fontSize: 9, color: textPrimary },
  holidayText: { color: isDark ? '#EF9A9A' : '#C62828' },
  dotRow: { flexDirection: 'row', gap: 1.5, marginTop: 1, height: 4 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
});
