import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { usePurchase } from '../context/PurchaseContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { OnboardingScreen } from '../app/OnboardingScreen';
import { MonthScreen } from '../app/MonthScreen';
import { DayScreen } from '../app/DayScreen';
import { WeekScreen } from '../app/WeekScreen';
import { YearScreen } from '../app/YearScreen';
import { SettingsScreen } from '../app/SettingsScreen';
import { BirthdayScreen } from './BirthdayScreen';

type Tab = 'day' | 'week' | 'month' | 'year';

export function MainNavigator() {
  const { isFirstLaunch } = useSettings();
  const { isPro, openPaywall } = usePurchase();
  const theme = useAppTheme();
  const { accent, onAccent, textPrimary, surface } = theme;
  const [activeTab, setActiveTab] = useState<Tab>('month');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);
  const [monthNav, setMonthNav] = useState<{ year: number; month: number } | undefined>();
  const s = styles(theme);

  if (isFirstLaunch) return <OnboardingScreen />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.appTitle}>PlanIt</Text>
        <View style={s.headerBtns}>
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => isPro ? setBirthdayVisible(true) : openPaywall()}
          >
            <Ionicons name="gift-outline" size={20} color={textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="settings-outline" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pill Tabs */}
      <View style={s.tabRow}>
        {([
          { key: 'day', label: 'Tag' },
          { key: 'week', label: 'Woche' },
          { key: 'month', label: 'Monat' },
          { key: 'year', label: 'Jahr' },
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
        {activeTab === 'month' && <MonthScreen initialYear={monthNav?.year} initialMonth={monthNav?.month} />}
        {activeTab === 'year' && (
          <YearScreen onMonthPress={(y, m) => { setMonthNav({ year: y, month: m }); setActiveTab('month'); }} />
        )}
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

      {/* Geburtstage */}
      <BirthdayScreen visible={birthdayVisible} onClose={() => setBirthdayVisible(false)} />
    </SafeAreaView>
  );
}

const styles = ({ accent, onAccent, bg, surface, textPrimary, textSecondary, border }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  appTitle: { fontSize: 24, fontWeight: '600', color: textPrimary },
  headerBtns: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: surface,
    alignItems: 'center', justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 20, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: border,
  },
  tab: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 0.5, borderColor: border,
    backgroundColor: surface,
  },
  tabActive: { backgroundColor: accent, borderColor: accent },
  tabText: { fontSize: 13, fontWeight: '500', color: textSecondary },
  tabTextActive: { color: onAccent },
  content: { flex: 1 },
});
