import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Switch,
  Modal, ScrollView, useColorScheme, Alert, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useEvents, Event, Reminder, Attachment, ATTACHMENTS_DIR } from '../context/EventContext';
import { usePurchase } from '../context/PurchaseContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { CATEGORIES } from '../constants/categories';

type Props = {
  visible: boolean;
  onClose: () => void;
  editEvent?: Event | null;
  defaultDate?: string;
};

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: 'Keine', value: 'none' },
  { label: 'Täglich', value: 'daily' },
  { label: 'Wöchentlich', value: 'weekly' },
  { label: 'Monatlich', value: 'monthly' },
  { label: 'Jährlich', value: 'yearly' },
];

const REMINDERS: { label: string; value: Reminder }[] = [
  { label: 'Keine', value: 'none' },
  { label: '15 Minuten vorher', value: '15min' },
  { label: '1 Stunde vorher', value: '1h' },
  { label: '1 Tag vorher', value: '1day' },
];

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function timeToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}
function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function dateStringToDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function dateToDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function defaultRecurrenceEnd(startDate: string): string {
  const d = dateStringToDate(startDate);
  d.setFullYear(d.getFullYear() + 1);
  return dateToDateString(d);
}
function generateOccurrences(base: Omit<Event, 'id'>, recurrence: RecurrenceType, until: string): Omit<Event, 'id'>[] {
  const results: Omit<Event, 'id'>[] = [];
  const end = dateStringToDate(until);
  let current = dateStringToDate(base.date);
  while (current <= end && results.length < 500) {
    results.push({ ...base, date: dateToDateString(current) });
    const next = new Date(current);
    if (recurrence === 'daily')   next.setDate(next.getDate() + 1);
    if (recurrence === 'weekly')  next.setDate(next.getDate() + 7);
    if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);
    if (recurrence === 'yearly')  next.setFullYear(next.getFullYear() + 1);
    current = next;
  }
  return results;
}

export function EventFormModal({ visible, onClose, editEvent, defaultDate }: Props) {
  const theme = useAppTheme();
  const { isDark, accent, onAccent, textSecondary, textTertiary } = theme;
  const { addEvent, addEvents, updateEvent, deleteEvent, deleteEventSeries } = useEvents();
  const { isPro, openPaywall } = usePurchase();
  const s = styles(theme);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? todayString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [categoryId, setCategoryId] = useState('other');
  const [reminder, setReminder] = useState<Reminder>('none');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [recurrenceEnd, setRecurrenceEnd] = useState(() => defaultRecurrenceEnd(defaultDate ?? todayString()));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);

  useEffect(() => {
    const base = defaultDate ?? todayString();
    if (editEvent) {
      setTitle(editEvent.title);
      setDate(editEvent.date);
      setStartTime(editEvent.startTime);
      setEndTime(editEvent.endTime);
      setCategoryId(editEvent.categoryId);
      setReminder(editEvent.reminder);
      setNotes(editEvent.notes ?? '');
      setLocation(editEvent.location ?? '');
      setAllDay(editEvent.allDay ?? false);
      setAttachments(editEvent.attachments ?? []);
      setRecurrence('none');
      setRecurrenceEnd(defaultRecurrenceEnd(editEvent.date));
    } else {
      setTitle(''); setDate(base); setStartTime('09:00'); setEndTime('10:00');
      setCategoryId('other'); setReminder('none'); setNotes('');
      setLocation(''); setAllDay(false); setAttachments([]);
      setRecurrence('none'); setRecurrenceEnd(defaultRecurrenceEnd(base));
    }
    setShowDatePicker(false); setShowStartPicker(false);
    setShowEndPicker(false); setShowRecurrenceEndPicker(false);
  }, [editEvent, visible]);

  const closeAllPickers = () => {
    setShowDatePicker(false); setShowStartPicker(false);
    setShowEndPicker(false); setShowRecurrenceEndPicker(false);
  };

  // ── Anhänge ──────────────────────────────────────────────────────────────
  const pickImage = async () => {
    if (!isPro) { openPaywall(); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung benötigt', 'Bitte erlaube den Zugriff auf die Mediathek.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const destName = `${Date.now()}_${asset.fileName ?? 'image.jpg'}`;
    const destUri = ATTACHMENTS_DIR + destName;
    await FileSystem.copyAsync({ from: asset.uri, to: destUri });
    setAttachments(prev => [...prev, { id: destName, uri: destUri, type: 'image', name: asset.fileName ?? 'Foto' }]);
  };

  const pickDocument = async () => {
    if (!isPro) { openPaywall(); return; }
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    const destName = `${Date.now()}_${asset.name}`;
    const destUri = ATTACHMENTS_DIR + destName;
    await FileSystem.copyAsync({ from: asset.uri, to: destUri });
    setAttachments(prev => [...prev, { id: destName, uri: destUri, type: 'document', name: asset.name }]);
  };

  const removeAttachment = async (id: string) => {
    const att = attachments.find(a => a.id === id);
    if (att) try { await FileSystem.deleteAsync(att.uri, { idempotent: true }); } catch {}
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // ── Speichern ────────────────────────────────────────────────────────────
  const save = async () => {
    if (!title.trim()) { Alert.alert('Titel fehlt', 'Bitte gib einen Titel ein.'); return; }
    if (editEvent) {
      await updateEvent({ ...editEvent, title: title.trim(), date, allDay, startTime, endTime, categoryId, reminder, notes, location, attachments });
      onClose(); return;
    }
    const baseData: Omit<Event, 'id'> = { title: title.trim(), date, allDay, startTime, endTime, categoryId, reminder, notes, location, attachments };
    if (recurrence === 'none') {
      await addEvent(baseData);
    } else {
      const seriesId = `series_${Date.now()}`;
      await addEvents(generateOccurrences({ ...baseData, seriesId }, recurrence, recurrenceEnd));
    }
    onClose();
  };

  // ── Löschen ──────────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (editEvent?.seriesId) {
      Alert.alert('Termin löschen', 'Möchtest du nur diesen Termin oder alle Termine der Serie löschen?', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Nur diesen', onPress: async () => { await deleteEvent(editEvent.id); onClose(); } },
        { text: 'Alle der Serie', style: 'destructive', onPress: async () => { await deleteEventSeries(editEvent.seriesId!); onClose(); } },
      ]);
    } else {
      Alert.alert('Termin löschen', `"${editEvent?.title}" wirklich löschen?`, [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteEvent(editEvent!.id); onClose(); } },
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>

        {/* Topbar */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={onClose} style={s.topBtn}>
            <Text style={s.topBtnText}>Abbrechen</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>{editEvent ? 'Bearbeiten' : 'Neuer Termin'}</Text>
          <TouchableOpacity onPress={save} style={s.topBtn}>
            <Text style={[s.topBtnText, s.topBtnSave]}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>

          {/* Titel + Notiz */}
          <View style={s.section}>
            <Text style={s.label}>Titel</Text>
            <TextInput style={s.inputTitle} placeholder="z.B. Arzttermin"
              placeholderTextColor={theme.textTertiary} value={title} onChangeText={setTitle} />
            <TextInput
              style={s.notesInline}
              placeholder="Notizen..."
              placeholderTextColor={theme.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Datum */}
          <View style={s.section}>
            <Text style={s.label}>Datum</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => { closeAllPickers(); setShowDatePicker(v => !v); }}>
              <Ionicons name="calendar-outline" size={16} color={textSecondary} />
              <Text style={s.pickerBtnText}>
                {dateStringToDate(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={dateStringToDate(date)} mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} locale="de-DE"
                onChange={(_, sel) => { if (sel) setDate(dateToDateString(sel)); if (Platform.OS === 'android') setShowDatePicker(false); }}
                style={s.picker} />
            )}
          </View>

          {/* Ganztägig */}
          <View style={s.section}>
            <View style={s.allDayRow}>
              <Text style={s.allDayLabel}>Ganztägig</Text>
              <Switch
                value={allDay}
                onValueChange={v => { setAllDay(v); if (v) { setShowStartPicker(false); setShowEndPicker(false); } }}
                trackColor={{ false: theme.border, true: accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Startzeit */}
          {!allDay && (
            <View style={s.section}>
              <Text style={s.label}>Startzeit</Text>
              <TouchableOpacity style={s.pickerBtn} onPress={() => { closeAllPickers(); setShowStartPicker(v => !v); }}>
                <Ionicons name="time-outline" size={16} color={textSecondary} />
                <Text style={s.pickerBtnText}>{startTime} Uhr</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker value={timeToDate(startTime)} mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'} locale="de-DE" is24Hour
                  onChange={(_, sel) => { if (sel) setStartTime(dateToTime(sel)); if (Platform.OS === 'android') setShowStartPicker(false); }}
                  style={s.picker} />
              )}
            </View>
          )}

          {/* Endzeit */}
          {!allDay && (
            <View style={s.section}>
              <Text style={s.label}>Endzeit</Text>
              <TouchableOpacity style={s.pickerBtn} onPress={() => { closeAllPickers(); setShowEndPicker(v => !v); }}>
                <Ionicons name="time-outline" size={16} color={textSecondary} />
                <Text style={s.pickerBtnText}>{endTime} Uhr</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker value={timeToDate(endTime)} mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'} locale="de-DE" is24Hour
                  onChange={(_, sel) => { if (sel) setEndTime(dateToTime(sel)); if (Platform.OS === 'android') setShowEndPicker(false); }}
                  style={s.picker} />
              )}
            </View>
          )}

          {/* Standort */}
          <View style={s.section}>
            <Text style={s.label}>Standort</Text>
            <View style={s.locationWrap}>
              <Ionicons name="location-outline" size={16} color={textSecondary} style={s.locationIcon} />
              <TextInput
                style={s.locationInput}
                placeholder="Ort oder Adresse"
                placeholderTextColor={isDark ? '#555' : '#bbb'}
                value={location}
                onChangeText={setLocation}
              />
              {location.length > 0 && (
                <TouchableOpacity onPress={() => setLocation('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Kategorie */}
          <View style={s.section}>
            <Text style={s.label}>Kategorie</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.id}
                  style={[s.catPill, categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color, borderWidth: 1.5 }]}
                  onPress={() => setCategoryId(cat.id)}>
                  <View style={[s.catDot, { backgroundColor: cat.color }]} />
                  <Text style={[s.catLabel, categoryId === cat.id && { color: cat.color, fontWeight: '600' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Wiederholung */}
          {!editEvent && (
            <View style={s.section}>
              <View style={s.labelRow}>
                <Text style={[s.label, { marginBottom: 0 }]}>Wiederholung</Text>
                {!isPro && (
                  <View style={s.proBadge}>
                    <Ionicons name="star" size={9} color={onAccent} />
                    <Text style={[s.proBadgeText, { color: onAccent }]}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={s.recurrenceRow}>
                {RECURRENCE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.value}
                    style={[s.recurrencePill, recurrence === opt.value && s.recurrencePillActive, !isPro && opt.value !== 'none' && s.recurrencePillLocked]}
                    onPress={() => { if (!isPro && opt.value !== 'none') { openPaywall(); return; } setRecurrence(opt.value); }}>
                    {!isPro && opt.value !== 'none' && <Ionicons name="lock-closed" size={10} color={textTertiary} />}
                    <Text style={[s.recurrencePillText, recurrence === opt.value && s.recurrencePillTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {recurrence !== 'none' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[s.label, { marginBottom: 8 }]}>Wiederholen bis</Text>
                  <TouchableOpacity style={s.pickerBtn} onPress={() => { closeAllPickers(); setShowRecurrenceEndPicker(v => !v); }}>
                    <Ionicons name="calendar-outline" size={16} color={textSecondary} />
                    <Text style={s.pickerBtnText}>
                      {dateStringToDate(recurrenceEnd).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                  {showRecurrenceEndPicker && (
                    <DateTimePicker value={dateStringToDate(recurrenceEnd)} minimumDate={dateStringToDate(date)} mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'} locale="de-DE"
                      onChange={(_, sel) => { if (sel) setRecurrenceEnd(dateToDateString(sel)); if (Platform.OS === 'android') setShowRecurrenceEndPicker(false); }}
                      style={s.picker} />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Erinnerung */}
          <View style={s.section}>
            <Text style={s.label}>Erinnerung</Text>
            {REMINDERS.map(r => (
              <TouchableOpacity key={r.value} style={s.reminderRow} onPress={() => setReminder(r.value)}>
                <Text style={s.reminderText}>{r.label}</Text>
                {reminder === r.value && <Ionicons name="checkmark" size={18} color={accent} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Anhänge */}
          <View style={s.section}>
            <View style={s.labelRow}>
              <Text style={[s.label, { marginBottom: 0 }]}>Anhänge</Text>
              {!isPro && (
                <View style={s.proBadge}>
                  <Ionicons name="star" size={9} color={onAccent} />
                  <Text style={[s.proBadgeText, { color: onAccent }]}>PRO</Text>
                </View>
              )}
            </View>
            {attachments.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.attachRow}>
                {attachments.map(att => (
                  <View key={att.id} style={s.attachItem}>
                    {att.type === 'image' ? (
                      <Image source={{ uri: att.uri }} style={s.attachThumb} />
                    ) : (
                      <View style={s.attachDoc}>
                        <Ionicons name="document-outline" size={24} color={textSecondary} />
                        <Text style={s.attachName} numberOfLines={2}>{att.name}</Text>
                      </View>
                    )}
                    <TouchableOpacity style={s.attachRemove} onPress={() => removeAttachment(att.id)}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={s.attachBtns}>
              <TouchableOpacity style={s.attachBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={16} color={textSecondary} />
                <Text style={s.attachBtnText}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.attachBtn} onPress={pickDocument}>
                <Ionicons name="document-outline" size={16} color={textSecondary} />
                <Text style={s.attachBtnText}>Dokument</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Löschen */}
          {editEvent && (
            <TouchableOpacity style={s.deleteBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color="#A32D2D" />
              <Text style={s.deleteBtnText}>{editEvent.seriesId ? 'Serie löschen…' : 'Termin löschen'}</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = ({ accent, onAccent, bg, surface, surfaceElevated, textPrimary, textSecondary, textTertiary, border, isDark }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 32, paddingBottom: 14,
    borderBottomWidth: 0.5, borderBottomColor: border,
  },
  topBtn: { minWidth: 80 },
  topBtnText: { fontSize: 16, color: textSecondary },
  topBtnSave: { color: accent, fontWeight: '600', textAlign: 'right' },
  topTitle: { fontSize: 16, fontWeight: '600', color: textPrimary },
  scroll: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '500', color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    borderWidth: 0.5, borderColor: border,
    borderRadius: 12, padding: 13, fontSize: 15,
    color: textPrimary, backgroundColor: surface,
  },
  inputTitle: {
    borderWidth: 0.5, borderColor: border,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    padding: 13, fontSize: 15,
    color: textPrimary, backgroundColor: surface,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 0.5, borderColor: border,
    borderRadius: 12, padding: 13, backgroundColor: surface,
  },
  pickerBtnText: { fontSize: 15, color: textPrimary },
  picker: { marginTop: 8, backgroundColor: surface, borderRadius: 12 },
  locationWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: border,
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 2,
    backgroundColor: surface,
  },
  locationIcon: { marginRight: 8 },
  locationInput: { flex: 1, fontSize: 15, color: textPrimary, paddingVertical: 11 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 0.5, borderColor: border, backgroundColor: surface,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { fontSize: 13, color: textSecondary },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    backgroundColor: accent,
  },
  proBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrencePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 13, borderRadius: 20,
    borderWidth: 0.5, borderColor: border, backgroundColor: surface,
  },
  recurrencePillActive: { backgroundColor: accent, borderColor: accent },
  recurrencePillLocked: { opacity: 0.5 },
  recurrencePillText: { fontSize: 13, fontWeight: '500', color: textSecondary },
  recurrencePillTextActive: { color: onAccent },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6,
    borderWidth: 0.5, borderColor: border, backgroundColor: surface,
  },
  reminderText: { fontSize: 15, color: textPrimary },
  attachRow: { marginBottom: 10 },
  attachItem: { position: 'relative', marginRight: 8 },
  attachThumb: { width: 72, height: 72, borderRadius: 10 },
  attachDoc: {
    width: 72, height: 72, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: surfaceElevated, padding: 8,
  },
  attachName: { fontSize: 8, color: textSecondary, textAlign: 'center', marginTop: 4 },
  attachRemove: { position: 'absolute', top: -6, right: -6 },
  attachBtns: { flexDirection: 'row', gap: 8 },
  attachBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 0.5, borderColor: border, backgroundColor: surface,
  },
  attachBtnText: { fontSize: 14, color: textSecondary },
  notesInline: {
    borderWidth: 0.5, borderColor: border,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    paddingHorizontal: 13, paddingTop: 10, paddingBottom: 13,
    fontSize: 14, minHeight: 72,
    color: textPrimary, backgroundColor: surface,
  },
  allDayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  allDayLabel: { fontSize: 15, fontWeight: '500', color: textPrimary },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 12, marginTop: 8,
    borderWidth: 0.5, borderColor: '#F09595', backgroundColor: isDark ? '#1a0a0a' : '#FCEBEB',
  },
  deleteBtnText: { fontSize: 15, color: '#A32D2D', fontWeight: '500' },
});
