import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  useColorScheme, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePurchase } from '../context/PurchaseContext';

const PRO_FEATURES = [
  { icon: 'repeat' as const,                label: 'Wiederholende Termine',  sub: 'täglich, wöchentlich, monatlich, jährlich' },
  { icon: 'attach' as const,                label: 'Anhänge',                sub: 'Fotos und Dokumente zu Terminen hinzufügen' },
  { icon: 'color-palette-outline' as const, label: 'Exklusive Designs',      sub: 'Ozean & Amethyst – kompletter Look-Wechsel' },
  { icon: 'gift-outline' as const,          label: 'Geburtstagsplanner',     sub: 'Geburtstage verwalten & nie mehr vergessen' },
];

export function ProPaywallModal() {
  const isDark = useColorScheme() === 'dark';
  const { paywallVisible, closePaywall, purchasePro, restorePurchases, isLoading } = usePurchase();
  const s = styles(isDark);

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closePaywall}
    >
      <View style={s.container}>
        {/* Schließen */}
        <TouchableOpacity style={s.closeBtn} onPress={closePaywall}>
          <Ionicons name="close" size={20} color={isDark ? '#888' : '#aaa'} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Icon + Titel */}
          <View style={s.heroSection}>
            <View style={s.iconWrap}>
              <Ionicons name="star" size={36} color={isDark ? '#1a1a1a' : '#fff'} />
            </View>
            <Text style={s.proLabel}>PlanIt Pro</Text>
            <Text style={s.subtitle}>Schalte alle Pro-Funktionen dauerhaft frei</Text>
          </View>

          {/* Feature-Liste */}
          <View style={s.featureList}>
            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <Ionicons name={f.icon} size={18} color={isDark ? '#fff' : '#1a1a1a'} />
                </View>
                <View style={s.featureText}>
                  <Text style={s.featureLabel}>{f.label}</Text>
                  <Text style={s.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Preis-Info */}
          <View style={s.priceBox}>
            <Text style={s.priceAmount}>€2,99</Text>
            <Text style={s.priceNote}>Einmaliger Kauf · Kein Abo</Text>
          </View>

          {/* Kaufen */}
          <TouchableOpacity
            style={s.buyBtn}
            onPress={purchasePro}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? '#1a1a1a' : '#fff'} />
            ) : (
              <Text style={s.buyBtnText}>Jetzt freischalten · €2,99</Text>
            )}
          </TouchableOpacity>

          {/* Wiederherstellen */}
          <TouchableOpacity
            style={s.restoreBtn}
            onPress={restorePurchases}
            disabled={isLoading}
          >
            <Text style={s.restoreBtnText}>Kauf wiederherstellen</Text>
          </TouchableOpacity>

          <Text style={s.legal}>
            Einmaliger Kauf. Nach dem Kauf sind alle Pro-Funktionen dauerhaft freigeschaltet.
            Kein Abo, keine versteckten Kosten.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' },
  closeBtn: {
    alignSelf: 'flex-end',
    margin: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroSection: { alignItems: 'center', marginBottom: 36, marginTop: 8 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: isDark ? '#fff' : '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  proLabel: {
    fontSize: 28, fontWeight: '700',
    color: isDark ? '#fff' : '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15, textAlign: 'center',
    color: isDark ? '#888' : '#666',
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 16, borderRadius: 16,
    borderWidth: 0.5, borderColor: isDark ? '#333' : '#e5e5e5',
    backgroundColor: isDark ? '#242424' : '#fafafa',
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: isDark ? '#333' : '#efefef',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureLabel: {
    fontSize: 15, fontWeight: '600',
    color: isDark ? '#fff' : '#1a1a1a',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 13,
    color: isDark ? '#666' : '#999',
  },
  priceBox: {
    alignItems: 'center', marginBottom: 20,
  },
  priceAmount: {
    fontSize: 40, fontWeight: '700',
    color: isDark ? '#fff' : '#1a1a1a',
    letterSpacing: -1,
  },
  priceNote: {
    fontSize: 13, marginTop: 4,
    color: isDark ? '#666' : '#999',
  },
  buyBtn: {
    width: '100%', height: 54, borderRadius: 16,
    backgroundColor: isDark ? '#fff' : '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  buyBtnText: {
    fontSize: 16, fontWeight: '600',
    color: isDark ? '#1a1a1a' : '#fff',
  },
  restoreBtn: {
    paddingVertical: 10, marginBottom: 24,
  },
  restoreBtnText: {
    fontSize: 14,
    color: isDark ? '#555' : '#aaa',
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: 11, textAlign: 'center', lineHeight: 17,
    color: isDark ? '#444' : '#ccc',
  },
});
