import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';

const DATENSCHUTZ_URL = 'https://ruffryder69.github.io/planit-privacy/datenschutz.html';

export function RechtlichesScreen({ onClose }: { onClose: () => void }) {
  const theme = useAppTheme();
  const { textPrimary, textSecondary, surface, surfaceElevated, border, accent } = theme;
  const s = styles(theme);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Impressum & Datenschutz</Text>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={s.sectionTitle}>Impressum</Text>

        <View style={s.card}>
          <Text style={s.label}>ANGABEN GEMÄSS § 5 DDG</Text>
          <Text style={s.text}>
            Raphael Binder{'\n'}Shtarkstudio (Einzelunternehmen){'\n'}Ruppertshofenerstr. 10{'\n'}74592 Kirchberg/Jagst{'\n'}Deutschland
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>UMSATZSTEUER</Text>
          <Text style={s.text}>
            Die Kleinunternehmerregelung gemäß § 19 Abs. 1 UStG wird nicht in Anspruch genommen. Die steuerliche Erfassung beim zuständigen Finanzamt ist derzeit noch nicht abgeschlossen; eine Umsatzsteuer-Identifikationsnummer liegt noch nicht vor und wird nach Erteilung ergänzt.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>KONTAKT</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:shtarkstudio@gmail.com')}>
            <Text style={[s.text, s.link]}>shtarkstudio@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.label}>VERANTWORTLICH FÜR DEN INHALT NACH § 18 ABS. 2 MSTV</Text>
          <Text style={s.text}>
            Raphael Binder{'\n'}Ruppertshofenerstr. 10{'\n'}74592 Kirchberg/Jagst
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>EU-STREITSCHLICHTUNG</Text>
          <Text style={s.text}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://ec.europa.eu/consumers/odr/')}>
            <Text style={[s.text, s.link]}>ec.europa.eu/consumers/odr</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.label}>VERBRAUCHERSTREITBEILEGUNG</Text>
          <Text style={s.text}>
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>HAFTUNG FÜR INHALTE</Text>
          <Text style={s.text}>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>HAFTUNG FÜR EXTERNE LINKS</Text>
          <Text style={s.text}>
            Diese App enthält Verweise auf externe Webseiten Dritter (z.B. RevenueCat, Google Play, Apple App Store). Auf deren Inhalte haben wir keinen Einfluss, weshalb wir hierfür keine Gewähr übernehmen.
          </Text>
        </View>

        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Datenschutz</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(DATENSCHUTZ_URL)}
          style={[s.card, { backgroundColor: surfaceElevated, borderColor: accent }]}
        >
          <Text style={s.text}>Die vollständige Datenschutzerklärung findest du hier:</Text>
          <Text style={[s.text, s.link, { marginTop: 6 }]}>Datenschutzerklärung öffnen →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = ({ bg, surface, textPrimary, textSecondary, border, accent }: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: border,
  },
  title: { fontSize: 18, fontWeight: '600', color: textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: surface,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: textPrimary, marginBottom: 10 },
  card: {
    borderRadius: 14, borderWidth: 0.5, borderColor: border,
    backgroundColor: surface, padding: 16, marginBottom: 10,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: textSecondary, marginBottom: 8 },
  text: { fontSize: 14, lineHeight: 21, color: textPrimary },
  link: { color: accent, fontWeight: '600' },
});
