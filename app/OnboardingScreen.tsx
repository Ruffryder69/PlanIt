import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet,  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { BUNDESLAENDER } from '../constants/holidays';
import { SafeAreaView } from 'react-native-safe-area-context';

export function OnboardingScreen() {
  const { setBundesland, completeOnboarding } = useSettings();
  const [selected, setSelected] = useState('BW');
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const s = styles(isDark);

  const confirm = async () => {
    await setBundesland(selected);
    await completeOnboarding();
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <Text style={s.title}>Willkommen bei PlanIt</Text>
        <Text style={s.subtitle}>Wähle dein Bundesland für die Feiertage</Text>
        <FlatList
          data={BUNDESLAENDER}
          keyExtractor={i => i.id}
          style={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.row, selected === item.id && s.rowSelected]}
              onPress={() => setSelected(item.id)}
            >
              <Text style={[s.rowText, selected === item.id && s.rowTextSelected]}>
                {item.name}
              </Text>
              {selected === item.id && (
                <Ionicons name="checkmark" size={18} color={isDark ? '#fff' : '#1a1a1a'} />
              )}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={s.btn} onPress={confirm}>
          <Text style={s.btnText}>Weiter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' },
  inner: { flex: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a', marginTop: 32 },
  subtitle: { fontSize: 15, color: isDark ? '#aaa' : '#666', marginTop: 8, marginBottom: 24 },
  list: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e0e0e0',
  },
  rowSelected: { borderColor: isDark ? '#fff' : '#1a1a1a', borderWidth: 1.5 },
  rowText: { fontSize: 15, color: isDark ? '#ccc' : '#333' },
  rowTextSelected: { fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a' },
  btn: {
    backgroundColor: isDark ? '#fff' : '#1a1a1a',
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: isDark ? '#1a1a1a' : '#fff' },
});