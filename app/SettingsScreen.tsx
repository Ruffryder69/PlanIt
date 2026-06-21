import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { usePurchase } from '../context/PurchaseContext';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { BUNDESLAENDER } from '../constants/holidays';
import { THEMES } from '../constants/themes';
import { RechtlichesScreen } from './RechtlichesScreen';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const theme = useAppTheme();
  const { accent, onAccent, textPrimary, textSecondary } = theme;
  const { bundesland, setBundesland, themeId, setThemeId } = useSettings();
  const { isPro, isLoading, openPaywall, restorePurchases } = usePurchase();
  const [legalVisible, setLegalVisible] = useState(false);
  const s = styles(theme);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Einstellungen</Text>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Design / Farbthema */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>Design</Text>
          {!isPro && (
            <View style={s.proBadge}>
              <Ionicons name="star" size={9} color={onAccent} />
              <Text style={[s.proBadgeText, { color: onAccent }]}>PRO</Text>
            </View>
          )}
        </View>
        <View style={s.themeRow}>
          {THEMES.map(t => {
            const isActive = themeId === t.id;
            const isLocked = !isPro && t.id !== 'classic';
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.themeCard, isActive && s.themeCardActive]}
                onPress={() => {
                  if (isLocked) { openPaywall(); return; }
                  setThemeId(t.id);
                }}
              >
                <View style={[s.themeSwatch, { backgroundColor: t.swatch }]}>
                  {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
                  {isLocked && !isActive && <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.9)" />}
                </View>
                <Text style={[s.themeLabel, isActive && s.themeLabelActive]}>{t.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pro-Sektion */}
        <Text style={s.sectionLabel}>PlanIt Pro</Text>
        {isPro ? (
          <View style={s.proActiveCard}>
            <View style={s.proActiveIcon}>
              <Ionicons name="star" size={20} color={onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.proActiveTitle}>Pro aktiviert</Text>
              <Text style={s.proActiveSub}>Alle Pro-Funktionen sind freigeschaltet.</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#43A047" />
          </View>
        ) : (
          <View style={s.proSection}>
            <TouchableOpacity style={s.proUpgradeBtn} onPress={openPaywall} disabled={isLoading}>
              <View style={s.proUpgradeIcon}>
                <Ionicons name="star-outline" size={18} color={textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.proUpgradeTitle}>Auf Pro upgraden</Text>
                <Text style={s.proUpgradeSub}>Einmaliger Kauf · €2,99</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.restoreBtn} onPress={restorePurchases} disabled={isLoading}>
              <Text style={s.restoreBtnText}>Kauf wiederherstellen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bundesland */}
        <Text style={s.sectionLabel}>Bundesland</Text>
        <View style={{ paddingHorizontal: 16 }}>
          {BUNDESLAENDER.map(item => {
            const isSelected = item.id === bundesland;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.row, isSelected && s.rowSelected]}
                onPress={() => setBundesland(item.id)}
              >
                <Text style={[s.rowText, isSelected && s.rowTextSelected]}>{item.name}</Text>
                {isSelected && <Ionicons name="checkmark" size={18} color={accent} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rechtliches */}
        <TouchableOpacity style={s.legalLink} onPress={() => setLegalVisible(true)}>
          <Text style={s.legalLinkText}>Impressum & Datenschutz</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        visible={legalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalVisible(false)}
      >
        <RechtlichesScreen onClose={() => setLegalVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = ({ accent, onAccent, bg, surface, surfaceElevated, textPrimary, textSecondary, textTertiary, border }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: border,
  },
  title: { fontSize: 20, fontWeight: '600', color: textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: surface,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: 20, marginTop: 24, marginBottom: 10,
  },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    backgroundColor: accent,
  },
  proBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  // Theme Picker
  themeRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16,
  },
  themeCard: {
    flex: 1, alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 16,
    borderWidth: 0.5, borderColor: border,
    backgroundColor: surface,
  },
  themeCardActive: {
    borderColor: accent, borderWidth: 1.5,
    backgroundColor: surfaceElevated,
  },
  themeSwatch: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  themeLabel: { fontSize: 12, fontWeight: '500', color: textSecondary },
  themeLabelActive: { color: accent, fontWeight: '600' },
  // Pro aktiviert
  proActiveCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, padding: 16, borderRadius: 16,
    borderWidth: 0.5, borderColor: '#43A047',
    backgroundColor: surface,
  },
  proActiveIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: accent,
    alignItems: 'center', justifyContent: 'center',
  },
  proActiveTitle: { fontSize: 15, fontWeight: '600', color: textPrimary },
  proActiveSub: { fontSize: 13, color: textSecondary, marginTop: 1 },
  proSection: { marginHorizontal: 16 },
  proUpgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16,
    borderWidth: 0.5, borderColor: border,
    backgroundColor: surface, marginBottom: 8,
  },
  proUpgradeIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  proUpgradeTitle: { fontSize: 15, fontWeight: '600', color: textPrimary },
  proUpgradeSub: { fontSize: 13, color: textSecondary, marginTop: 1 },
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreBtnText: { fontSize: 13, color: textTertiary, textDecorationLine: 'underline' },
  // Bundesland
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 0.5, borderColor: border,
    backgroundColor: surface,
  },
  rowSelected: { borderColor: accent, borderWidth: 1.5, backgroundColor: surfaceElevated },
  rowText: { fontSize: 15, color: textSecondary },
  rowTextSelected: { fontWeight: '600', color: textPrimary },
  // Rechtliches
  legalLink: { alignItems: 'center', paddingVertical: 20 },
  legalLinkText: { fontSize: 13, color: textTertiary, textDecorationLine: 'underline' },
});
