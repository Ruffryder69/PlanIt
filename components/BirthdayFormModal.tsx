import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Birthday, BirthdayReminder, useBirthdays } from '../context/BirthdayContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
  editBirthday?: Birthday | null;
};

const REMINDERS: { label: string; value: BirthdayReminder }[] = [
  { label: 'Keine', value: 'none' },
  { label: '1 Tag vorher', value: '1day' },
  { label: '1 Woche vorher', value: '1week' },
];

export function BirthdayFormModal({ visible, onClose, editBirthday }: Props) {
  const theme = useAppTheme();
  const { accent, onAccent, textSecondary } = theme;
  const { addBirthday, updateBirthday, deleteBirthday } = useBirthdays();
  const s = styles(theme);

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date(2000, 0, 1));
  const [withYear, setWithYear] = useState(false);
  const [reminder, setReminder] = useState<BirthdayReminder>('1day');
  const [notes, setNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (editBirthday) {
      setName(editBirthday.name);
      setDate(new Date(editBirthday.year ?? 2000, editBirthday.month - 1, editBirthday.day));
      setWithYear(!!editBirthday.year);
      setReminder(editBirthday.reminder);
      setNotes(editBirthday.notes ?? '');
    } else {
      setName(''); setDate(new Date(2000, 0, 1)); setWithYear(false);
      setReminder('1day'); setNotes('');
    }
    setShowPicker(false);
  }, [editBirthday, visible]);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Name fehlt', 'Bitte gib einen Namen ein.'); return; }
    const data: Omit<Birthday, 'id'> = {
      name: name.trim(),
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: withYear ? date.getFullYear() : undefined,
      reminder,
      notes: notes.trim() || undefined,
    };
    if (editBirthday) {
      await updateBirthday({ ...editBirthday, ...data });
    } else {
      await addBirthday(data);
    }
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert('Löschen', `"${editBirthday?.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteBirthday(editBirthday!.id); onClose(); } },
    ]);
  };

  const dateLabel = withYear
    ? date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={onClose} style={s.topBtn}>
            <Text style={s.topBtnText}>Abbrechen</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>{editBirthday ? 'Bearbeiten' : 'Geburtstag'}</Text>
          <TouchableOpacity onPress={save} style={s.topBtn}>
            <Text style={[s.topBtnText, { color: accent, fontWeight: '600', textAlign: 'right' }]}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>

          {/* Name */}
          <Text style={s.label}>Name</Text>
          <TextInput
            style={s.input}
            placeholder="z.B. Max Mustermann"
            placeholderTextColor={textSecondary}
            value={name}
            onChangeText={setName}
          />

          {/* Datum */}
          <Text style={[s.label, { marginTop: 20 }]}>Geburtstag</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setShowPicker(v => !v)}>
            <Ionicons name="gift-outline" size={16} color={textSecondary} />
            <Text style={s.pickerBtnText}>{dateLabel}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              locale="de-DE"
              onChange={(_, sel) => {
                if (sel) setDate(sel);
                if (Platform.OS === 'android') setShowPicker(false);
              }}
              style={s.picker}
            />
          )}

          {/* Jahreszahl */}
          <TouchableOpacity style={s.yearToggle} onPress={() => setWithYear(v => !v)}>
            <Ionicons name={withYear ? 'checkbox' : 'square-outline'} size={20} color={accent} />
            <Text style={s.yearToggleText}>Geburtsjahr angeben (für Altersanzeige)</Text>
          </TouchableOpacity>

          {/* Erinnerung */}
          <Text style={[s.label, { marginTop: 20 }]}>Erinnerung</Text>
          {REMINDERS.map(r => (
            <TouchableOpacity key={r.value} style={s.reminderRow} onPress={() => setReminder(r.value)}>
              <Text style={s.reminderText}>{r.label}</Text>
              {reminder === r.value && <Ionicons name="checkmark" size={18} color={accent} />}
            </TouchableOpacity>
          ))}

          {/* Notizen */}
          <Text style={[s.label, { marginTop: 20 }]}>Notiz (optional)</Text>
          <TextInput
            style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="z.B. mag Schokoladenkuchen"
            placeholderTextColor={textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Löschen */}
          {editBirthday && (
            <TouchableOpacity style={s.deleteBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color="#A32D2D" />
              <Text style={s.deleteBtnText}>Geburtstag löschen</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = ({ accent, onAccent, bg, surface, surfaceElevated, textPrimary, textSecondary, border, isDark }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 32, paddingBottom: 14,
    borderBottomWidth: 0.5, borderBottomColor: border,
  },
  topBtn: { minWidth: 80 },
  topBtnText: { fontSize: 16, color: textSecondary },
  topTitle: { fontSize: 16, fontWeight: '600', color: textPrimary },
  scroll: { padding: 20, paddingBottom: 60 },
  label: {
    fontSize: 11, fontWeight: '600', color: textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  input: {
    borderWidth: 0.5, borderColor: border, borderRadius: 12,
    padding: 13, fontSize: 15, color: textPrimary, backgroundColor: surface,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 0.5, borderColor: border, borderRadius: 12,
    padding: 13, backgroundColor: surface,
  },
  pickerBtnText: { fontSize: 15, color: textPrimary },
  picker: { marginTop: 8, backgroundColor: surface, borderRadius: 12 },
  yearToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 12, paddingVertical: 4,
  },
  yearToggleText: { fontSize: 14, color: textSecondary },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6,
    borderWidth: 0.5, borderColor: border, backgroundColor: surface,
  },
  reminderText: { fontSize: 15, color: textPrimary },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 12, marginTop: 16,
    borderWidth: 0.5, borderColor: '#F09595',
    backgroundColor: isDark ? '#1a0a0a' : '#FCEBEB',
  },
  deleteBtnText: { fontSize: 15, color: '#A32D2D', fontWeight: '500' },
});
