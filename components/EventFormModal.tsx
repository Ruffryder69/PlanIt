import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, useColorScheme, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEvents, Event, Reminder } from '../context/EventContext';
import { CATEGORIES } from '../constants/categories';

type Props = {
  visible: boolean;
  onClose: () => void;
  editEvent?: Event | null;
  defaultDate?: string;
};

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

function timeToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function dateStringToDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function EventFormModal({ visible, onClose, editEvent, defaultDate }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { addEvent, updateEvent, deleteEvent } = useEvents();
  const s = styles(isDark);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? todayString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [categoryId, setCategoryId] = useState('other');
  const [reminder, setReminder] = useState<Reminder>('none');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDate(editEvent.date);
      setStartTime(editEvent.startTime);
      setEndTime(editEvent.endTime);
      setCategoryId(editEvent.categoryId);
      setReminder(editEvent.reminder);
      setNotes(editEvent.notes ?? '');
      setShowNotes(!!editEvent.notes);
    } else {
      setTitle('');
      setDate(defaultDate ?? todayString());
      setStartTime('09:00');
      setEndTime('10:00');
      setCategoryId('other');
      setReminder('none');
      setNotes('');
      setShowNotes(false);
    }
    setShowDatePicker(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
  }, [editEvent, visible]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Titel fehlt', 'Bitte gib einen Titel ein.');
      return;
    }
    const data = { title: title.trim(), date, startTime, endTime, categoryId, reminder, notes };
    if (editEvent) {
      await updateEvent({ ...data, id: editEvent.id });
    } else {
      await addEvent(data);
    }
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Termin löschen',
      `"${editEvent?.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          await deleteEvent(editEvent!.id);
          onClose();
        }},
      ]
    );
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

          {/* Titel */}
          <View style={s.section}>
            <Text style={s.label}>Titel</Text>
            <TextInput
              style={s.input}
              placeholder="z.B. Arzttermin"
              placeholderTextColor={isDark ? '#555' : '#bbb'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Datum */}
          <View style={s.section}>
            <Text style={s.label}>Datum</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => {
              setShowStartPicker(false);
              setShowEndPicker(false);
              setShowDatePicker(v => !v);
            }}>
              <Ionicons name="calendar-outline" size={16} color={isDark ? '#888' : '#aaa'} />
              <Text style={s.pickerBtnText}>
                {dateStringToDate(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateStringToDate(date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale="de-DE"
                onChange={(_, selected) => {
                  if (selected) setDate(dateToDateString(selected));
                  if (Platform.OS === 'android') setShowDatePicker(false);
                }}
                style={s.picker}
              />
            )}
          </View>

          {/* Startzeit */}
          <View style={s.section}>
            <Text style={s.label}>Startzeit</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => {
              setShowDatePicker(false);
              setShowEndPicker(false);
              setShowStartPicker(v => !v);
            }}>
              <Ionicons name="time-outline" size={16} color={isDark ? '#888' : '#aaa'} />
              <Text style={s.pickerBtnText}>{startTime} Uhr</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={timeToDate(startTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale="de-DE"
                is24Hour={true}
                onChange={(_, selected) => {
                  if (selected) setStartTime(dateToTime(selected));
                  if (Platform.OS === 'android') setShowStartPicker(false);
                }}
                style={s.picker}
              />
            )}
          </View>

          {/* Endzeit */}
          <View style={s.section}>
            <Text style={s.label}>Endzeit</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => {
              setShowDatePicker(false);
              setShowStartPicker(false);
              setShowEndPicker(v => !v);
            }}>
              <Ionicons name="time-outline" size={16} color={isDark ? '#888' : '#aaa'} />
              <Text style={s.pickerBtnText}>{endTime} Uhr</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={timeToDate(endTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale="de-DE"
                is24Hour={true}
                onChange={(_, selected) => {
                  if (selected) setEndTime(dateToTime(selected));
                  if (Platform.OS === 'android') setShowEndPicker(false);
                }}
                style={s.picker}
              />
            )}
          </View>

          {/* Kategorie */}
          <View style={s.section}>
            <Text style={s.label}>Kategorie</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catPill, categoryId === cat.id && { backgroundColor: cat.lightBg, borderColor: cat.color, borderWidth: 1.5 }]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <View style={[s.catDot, { backgroundColor: cat.color }]} />
                  <Text style={[s.catLabel, categoryId === cat.id && { color: cat.color, fontWeight: '600' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Erinnerung */}
          <View style={s.section}>
            <Text style={s.label}>Erinnerung</Text>
            {REMINDERS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={s.reminderRow}
                onPress={() => setReminder(r.value)}
              >
                <Text style={s.reminderText}>{r.label}</Text>
                {reminder === r.value && (
                  <Ionicons name="checkmark" size={18} color={isDark ? '#fff' : '#1a1a1a'} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Notizen */}
          <View style={s.section}>
            <TouchableOpacity style={s.notesToggle} onPress={() => setShowNotes(v => !v)}>
              <Ionicons
                name={showNotes ? 'chevron-down' : 'chevron-forward'}
                size={16} color={isDark ? '#888' : '#aaa'}
              />
              <Text style={s.notesToggleText}>
                {showNotes ? 'Notiz ausblenden' : 'Notiz hinzufügen'}
              </Text>
            </TouchableOpacity>
            {showNotes && (
              <TextInput
                style={s.notesInput}
                placeholder="Notizen..."
                placeholderTextColor={isDark ? '#555' : '#bbb'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          </View>

          {/* Löschen */}
          {editEvent && (
            <TouchableOpacity style={s.deleteBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color="#A32D2D" />
              <Text style={s.deleteBtnText}>Termin löschen</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: isDark ? '#333' : '#e5e5e5',
  },
  topBtn: { minWidth: 80 },
  topBtnText: { fontSize: 16, color: isDark ? '#aaa' : '#666' },
  topBtnSave: { color: isDark ? '#fff' : '#1a1a1a', fontWeight: '600', textAlign: 'right' },
  topTitle: { fontSize: 16, fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a' },
  scroll: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '500', color: isDark ? '#888' : '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
    borderRadius: 12, padding: 13, fontSize: 15,
    color: isDark ? '#fff' : '#1a1a1a',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
    borderRadius: 12, padding: 13,
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  pickerBtnText: { fontSize: 15, color: isDark ? '#fff' : '#1a1a1a' },
  picker: {
    marginTop: 8,
    backgroundColor: isDark ? '#242424' : '#fafafa',
    borderRadius: 12,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { fontSize: 13, color: isDark ? '#ccc' : '#555' },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  reminderText: { fontSize: 15, color: isDark ? '#ccc' : '#333' },
  notesToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  notesToggleText: { fontSize: 14, color: isDark ? '#888' : '#aaa' },
  notesInput: {
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
    borderRadius: 12, padding: 13, fontSize: 15, minHeight: 100,
    color: isDark ? '#fff' : '#1a1a1a',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 12, marginTop: 8,
    borderWidth: 0.5, borderColor: '#F09595',
    backgroundColor: isDark ? '#1a0a0a' : '#FCEBEB',
  },
  deleteBtnText: { fontSize: 15, color: '#A32D2D', fontWeight: '500' },
});