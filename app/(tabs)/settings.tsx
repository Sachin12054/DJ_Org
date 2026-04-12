import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAppSettings, saveAppSettings, AppSettings, exportEventsAsJSON } from '../../lib/storage';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useEvents } from '../../context/EventContext';

function SettingsRow({
  icon,
  label,
  subtitle,
  right,
  onPress,
  iconColor = Colors.primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  iconColor?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { events } = useEvents();
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    paymentReminders: true,
    morningReminders: true,
    currency: '₹',
  });

  useEffect(() => {
    getAppSettings().then(setSettings);
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveAppSettings(updated);
  };

  const handleExport = async () => {
    try {
      const json = await exportEventsAsJSON();
      Alert.alert(
        'Export Ready',
        `${events.length} events exported to JSON. In production this would save/share the file.`,
        [{ text: 'OK' }]
      );
      console.log('Export data:', json);
    } catch {
      Alert.alert('Error', 'Could not export data.');
    }
  };

  const handleAbout = () => {
    Alert.alert('DJ Event Manager', 'Version 1.0.0\nBuilt for professional DJs\n—\nManage events, payments, and reminders all in one place.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Banner */}
        <View style={[styles.profileBanner, Shadow.primary]}>
          <View style={styles.avatar}>
            <Ionicons name="musical-notes" size={32} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.djTitle}>DJ Event Manager</Text>
            <Text style={styles.djSub}>{events.length} events · ₹ Indian Rupee</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            label="Enable Notifications"
            subtitle="Receive event reminders"
            iconColor={Colors.primary}
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={v => updateSetting('notificationsEnabled', v)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="cash-outline"
            label="Payment Reminders"
            subtitle="1 day before event if amount pending"
            iconColor={Colors.warning}
            right={
              <Switch
                value={settings.paymentReminders}
                onValueChange={v => updateSetting('paymentReminders', v)}
                trackColor={{ false: Colors.border, true: Colors.warning }}
                thumbColor={Colors.text}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="sunny-outline"
            label="Morning Reminders"
            subtitle="Day-of event morning reminder"
            iconColor={Colors.accent}
            right={
              <Switch
                value={settings.morningReminders}
                onValueChange={v => updateSetting('morningReminders', v)}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor={Colors.text}
              />
            }
          />
        </View>

        {/* Data */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="download-outline"
            label="Export Data"
            subtitle="Export all events as JSON"
            iconColor={Colors.secondary}
            onPress={handleExport}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="stats-chart-outline"
            label="Total Events"
            subtitle={`${events.length} events stored locally`}
            iconColor={Colors.success}
          />
        </View>

        {/* App */}
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="information-circle-outline"
            label="About"
            subtitle="DJ Event Manager v1.0.0"
            iconColor={Colors.textSecondary}
            onPress={handleAbout}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="logo-github"
            label="Open Source"
            subtitle="View project on GitHub"
            iconColor={Colors.textSecondary}
            onPress={() => Linking.openURL('https://github.com')}
          />
        </View>

        <Text style={styles.footerText}>
          DJ Event Manager · Made with 🎧 for DJs
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  djTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  djSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs + 2,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  rowSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 52 + Spacing.md },
  footerText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xl,
  },
});
