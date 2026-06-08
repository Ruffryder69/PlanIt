import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { OnboardingScreen } from '../app/OnboardingScreen';
import { MonthScreen } from '../app/MonthScreen';
import { DayScreen } from '../app/DayScreen';
import { WeekScreen } from '../app/WeekScreen';
import { SettingsScreen } from '../app/SettingsScreen';

type Tab = 'day' | 'week' | 'month';

export function MainNavigator() {
  const { isFirstLaunch } = useSettings();
  const isDark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('month');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const s = styles(isDark);

  if (isFirstLaunch) return <OnboardingScreen />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.appTitle}>PlanIt</Text>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings-outline" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      {/* Pill Tabs */}
      <View style={s.tabRow}>
        {([
          { key: 'day', label: 'Tag' },
          { key: 'week', label: 'Woche' },
          { key: 'month', label: 'Monat' },
        ] as { key: Tab; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Screen Inhalt */}
      <View style={s.content}>
        {activeTab === 'day' && <DayScreen />}
        {activeTab === 'week' && <WeekScreen />}
        {activeTab === 'month' && <MonthScreen />}
      </View>

      {/* Einstellungen Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SettingsScreen onClose={() => setSettingsVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  appTitle: { fontSize: 24, fontWeight: '600', color: isDark ? '#fff' : '#1a1a1a' },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: isDark ? '#242424' : '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 20, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: isDark ? '#333' : '#e5e5e5',
  },
  tab: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 0.5, borderColor: isDark ? '#444' : '#e0e0e0',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  tabActive: {
    backgroundColor: isDark ? '#fff' : '#1a1a1a',
    borderColor: isDark ? '#fff' : '#1a1a1a',
  },
  tabText: { fontSize: 13, fontWeight: '500', color: isDark ? '#888' : '#aaa' },
  tabTextActive: { color: isDark ? '#1a1a1a' : '#fff' },
  content: { flex: 1 },
});