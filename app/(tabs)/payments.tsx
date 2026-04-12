import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../context/EventContext';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import PaymentBar from '../../components/PaymentBar';

export default function PaymentsScreen() {
  const router = useRouter();
  const { events, totalEarned, totalPending } = useEvents();

  const stats = useMemo(() => {
    const completed = events.filter(e => e.status === 'completed');
    const upcoming = events.filter(e => e.status === 'upcoming');

    // Monthly breakdown (current + last 5 months)
    const monthly: Record<string, { earned: number; count: number }> = {};
    [...completed, ...upcoming].forEach(e => {
      const d = new Date(e.eventDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { earned: 0, count: 0 };
      if (e.status === 'completed') {
        monthly[key].earned += e.totalAmount;
        monthly[key].count += 1;
      }
    });

    const sortedMonths = Object.keys(monthly).sort().reverse().slice(0, 6);

    const totalAdvance = upcoming.reduce((s, e) => s + e.advancePaid, 0);

    return {
      completed,
      upcoming,
      totalAdvance,
      sortedMonths,
      monthly,
    };
  }, [events]);

  const pendingEvents = events
    .filter(e => e.status === 'upcoming' && e.remainingAmount > 0)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero stats */}
        <View style={[styles.heroCard, Shadow.primary]}>
          <Text style={styles.heroLabel}>TOTAL EARNED</Text>
          <Text style={styles.heroValue}>₹{totalEarned.toLocaleString('en-IN')}</Text>
          <Text style={styles.heroSub}>{stats.completed.length} completed events</Text>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: Colors.warning + '44' }]}>
            <Ionicons name="time-outline" size={22} color={Colors.warning} />
            <Text style={styles.summaryValue}>
              ₹{totalPending.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: Colors.accent + '44' }]}>
            <Ionicons name="checkmark-done-outline" size={22} color={Colors.accent} />
            <Text style={styles.summaryValue}>
              ₹{stats.totalAdvance.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summaryLabel}>Advances</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: Colors.success + '44' }]}>
            <Ionicons name="musical-notes-outline" size={22} color={Colors.success} />
            <Text style={styles.summaryValue}>{stats.upcoming.length}</Text>
            <Text style={styles.summaryLabel}>Upcoming</Text>
          </View>
        </View>

        {/* Monthly breakdown */}
        {stats.sortedMonths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            {stats.sortedMonths.map(key => {
              const [year, month] = key.split('-');
              const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              });
              const val = stats.monthly[key];
              return (
                <View key={key} style={styles.monthRow}>
                  <View>
                    <Text style={styles.monthLabel}>{label}</Text>
                    <Text style={styles.monthCount}>{val.count} events</Text>
                  </View>
                  <Text style={styles.monthValue}>
                    ₹{val.earned.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Pending payments */}
        {pendingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Due Payments</Text>
            {pendingEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={[styles.paymentCard, Shadow.sm]}
                onPress={() => router.push(`/event/${event.id}` as any)}
              >
                <View style={styles.paymentCardTop}>
                  <View>
                    <Text style={styles.paymentEventName}>{event.eventName}</Text>
                    <Text style={styles.paymentClient}>{event.clientName}</Text>
                    <Text style={styles.paymentDate}>
                      {new Date(event.eventDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.paymentAmounts}>
                    <Text style={styles.paymentTotal}>
                      ₹{event.totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.paymentDue}>
                      ₹{event.remainingAmount.toLocaleString('en-IN')} due
                    </Text>
                  </View>
                </View>
                <PaymentBar total={event.totalAmount} paid={event.advancePaid} mini />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {totalEarned === 0 && totalPending === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No payment data yet</Text>
            <Text style={styles.emptySubtext}>Add events to track your income</Text>
          </View>
        )}
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
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  heroValue: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -1,
  },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  monthCount: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  monthValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.success },
  paymentCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  paymentEventName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  paymentClient: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  paymentDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  paymentAmounts: { alignItems: 'flex-end' },
  paymentTotal: { fontSize: FontSize.sm, color: Colors.textSecondary },
  paymentDue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.warning },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  emptySubtext: { fontSize: FontSize.md, color: Colors.textSecondary },
});
