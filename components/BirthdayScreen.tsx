import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBirthdays, Birthday, daysUntil, ageThisYear, avatarColor, nextBirthdayDate } from '../context/BirthdayContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { BirthdayFormModal } from './BirthdayFormModal';

type Props = { visible: boolean; onClose: () => void };

type Section = { title: string; data: Birthday[] };

function buildSections(birthdays: Birthday[]): Section[] {
  const sorted = [...birthdays].sort((a, b) => daysUntil(a.day, a.month) - daysUntil(b.day, b.month));
  const today: Birthday[] = [];
  const week: Birthday[] = [];
  const month: Birthday[] = [];
  const later: Birthday[] = [];

  for (const b of sorted) {
    const d = daysUntil(b.day, b.month);
    if (d === 0) today.push(b);
    else if (d <= 7) week.push(b);
    else if (d <= 31) month.push(b);
    else later.push(b);
  }

  const sections: Section[] = [];
  if (today.length) sections.push({ title: 'Heute', data: today });
  if (week.length) sections.push({ title: 'Diese Woche', data: week });
  if (month.length) sections.push({ title: 'Diesen Monat', data: month });
  if (later.length) sections.push({ title: 'Später', data: later });
  return sections;
}

function DaysBadge({ days, theme }: { days: number; theme: AppTheme }) {
  const s = badgeStyles(theme);
  if (days === 0) {
    return (
      <View style={s.todayBadge}>
        <Text style={s.todayBadgeText}>HEUTE!</Text>
      </View>
    );
  }
  return (
    <View style={s.daysBadge}>
      <Text style={s.daysNum}>{days}</Text>
      <Text style={s.daysLabel}>Tage</Text>
    </View>
  );
}

function BirthdayCard({ b, theme, onPress }: { b: Birthday; theme: AppTheme; onPress: () => void }) {
  const s = cardStyles(theme);
  const days = daysUntil(b.day, b.month);
  const color = avatarColor(b.name);
  const initial = b.name.trim().charAt(0).toUpperCase();
  const dateStr = `${String(b.day).padStart(2, '0')}.${String(b.month).padStart(2, '0')}.`;
  const ageStr = b.year ? ` · ${ageThisYear(b.year, b.month, b.day) + (days === 0 ? 0 : 1)} Jahre` : '';

  return (
    <TouchableOpacity style={[s.card, days === 0 && s.cardToday]} onPress={onPress} activeOpacity={0.7}>
      {days === 0 && <View style={s.todayStripe} />}
      <View style={[s.avatar, { backgroundColor: color }]}>
        <Text style={s.avatarText}>{initial}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{b.name}</Text>
        <Text style={s.sub}>{dateStr}{ageStr}</Text>
        {b.notes ? <Text style={s.notes} numberOfLines={1}>{b.notes}</Text> : null}
      </View>
      <DaysBadge days={days} theme={theme} />
    </TouchableOpacity>
  );
}

export function BirthdayScreen({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const { accent, onAccent, textPrimary, textSecondary } = theme;
  const { birthdays } = useBirthdays();
  const [formVisible, setFormVisible] = useState(false);
  const [editBirthday, setEditBirthday] = useState<Birthday | null>(null);
  const s = styles(theme);

  const sections = buildSections(birthdays);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.container} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcon}>
              <Ionicons name="gift" size={20} color={onAccent} />
            </View>
            <Text style={s.title}>Geburtstage</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>

        {birthdays.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="gift-outline" size={48} color={textSecondary} />
            </View>
            <Text style={s.emptyTitle}>Noch keine Geburtstage</Text>
            <Text style={s.emptySub}>Füge Geburtstage hinzu und verpasse nie wieder einen.</Text>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: accent }]}
              onPress={() => { setEditBirthday(null); setFormVisible(true); }}
            >
              <Ionicons name="add" size={18} color={onAccent} />
              <Text style={[s.emptyBtnText, { color: onAccent }]}>Geburtstag hinzufügen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll}>
            {sections.map(section => (
              <View key={section.title}>
                <Text style={s.sectionLabel}>{section.title}</Text>
                {section.data.map(b => (
                  <BirthdayCard
                    key={b.id}
                    b={b}
                    theme={theme}
                    onPress={() => { setEditBirthday(b); setFormVisible(true); }}
                  />
                ))}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* FAB */}
        {birthdays.length > 0 && (
          <TouchableOpacity
            style={[s.fab, { backgroundColor: accent }]}
            onPress={() => { setEditBirthday(null); setFormVisible(true); }}
          >
            <Ionicons name="add" size={28} color={onAccent} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <BirthdayFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        editBirthday={editBirthday}
      />
    </Modal>
  );
}

const styles = ({ accent, onAccent, bg, surface, textPrimary, textSecondary, border }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: accent,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: surface,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 20, marginBottom: 10,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 48, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
});

const cardStyles = ({ surface, surfaceElevated, textPrimary, textSecondary, textTertiary, border, accent }: AppTheme) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 20, marginBottom: 10,
    backgroundColor: surface,
    borderWidth: 0.5, borderColor: border,
    overflow: 'hidden',
  },
  cardToday: {
    borderColor: '#FF6B6B',
    borderWidth: 1.5,
  },
  todayStripe: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
    backgroundColor: '#FF6B6B',
    borderTopLeftRadius: 20, borderBottomLeftRadius: 20,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: textPrimary },
  sub: { fontSize: 13, color: textSecondary, marginTop: 2 },
  notes: { fontSize: 12, color: textTertiary, marginTop: 2, fontStyle: 'italic' },
});

const badgeStyles = ({ accent, onAccent, surface }: AppTheme) => StyleSheet.create({
  todayBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: '#FF6B6B',
  },
  todayBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  daysBadge: {
    alignItems: 'center', minWidth: 44,
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 12, backgroundColor: surface,
  },
  daysNum: { fontSize: 20, fontWeight: '800', color: accent, lineHeight: 22 },
  daysLabel: { fontSize: 10, color: accent, fontWeight: '500', opacity: 0.8 },
});
