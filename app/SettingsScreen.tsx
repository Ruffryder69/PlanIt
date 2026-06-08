import React from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { BUNDESLAENDER } from '../constants/holidays';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const isDark = useColorScheme() === 'dark';
  const { bundesland, setBundesland } = useSettings();
  const s = styles(isDark);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Einstellungen</Text>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      {/* Bundesland */}
      <Text style={s.sectionLabel}>Bundesland</Text>
      <FlatList
        data={BUNDESLAENDER}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isSelected = item.id === bundesland;
          return (
            <TouchableOpacity
              style={[s.row, isSelected && s.rowSelected]}
              onPress={() => setBundesland(item.id)}
            >
              <Text style={[s.rowText, isSelected && s.rowTextSelected]}>
                {item.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={18} color={isDark ? '#fff' : '#1a1a1a'} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: isDark ? '#333' : '#e5e5e5',
  },
  title: { fontSize: 20, fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: isDark ? '#666' : '#aaa',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: 20, marginTop: 20, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  rowSelected: {
    borderColor: isDark ? '#fff' : '#1a1a1a',
    borderWidth: 1.5,
    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
  },
  rowText: { fontSize: 15, color: isDark ? '#ccc' : '#333' },
  rowTextSelected: { fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a' },
});