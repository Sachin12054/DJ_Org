import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../context/EventContext';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import EventCard from '../../components/EventCard';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    events,
    upcomingEvents,
    pinnedEvents,
    todayEvents,
    totalEarned,
    totalPending,
    togglePin,
  } = useEvents();

  const [refreshing, setRefreshing] = React.useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning 🌅';
    if (h < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🎧';
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const next7Days = upcomingEvents.filter(e => {
    const d = new Date(e.eventDate);
    const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d <= in7;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.dateText}>{todayStr}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/event/add' as any)}
          >
            <Ionicons name="add" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="musical-notes"
            label="Total Events"
            value={String(events.length)}
            color={Colors.secondary}
          />
          <View style={{ width: 8 }} />
          <StatCard
            icon="checkmark-circle"
            label="Upcoming"
            value={String(upcomingEvents.length)}
            color={Colors.accent}
          />
          <View style={{ width: 8 }} />
          <StatCard
            icon="cash"
            label="Pending"
            value={`₹${(totalPending / 1000).toFixed(0)}K`}
            color={Colors.warning}
          />
        </View>

        {/* ── Earnings Banner */}
        <View style={[styles.earningsBanner, Shadow.primary]}>
          <View style={styles.earningsLeft}>
            <Ionicons name="trending-up" size={28} color={Colors.success} />
            <View style={{ marginLeft: Spacing.sm }}>
              <Text style={styles.earningsLabel}>Total Earned</Text>
              <Text style={styles.earningsValue}>
                ₹{totalEarned.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/(tabs)/payments' as any)}
          >
            <Text style={styles.viewAllText}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Today's Events */}
        {todayEvents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.sectionTitle}>Today's Events</Text>
              </View>
              <Text style={styles.sectionCount}>{todayEvents.length}</Text>
            </View>
            {todayEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}

        {/* ── Pinned Events */}
        {pinnedEvents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bookmark" size={14} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Pinned Events</Text>
              </View>
              <Text style={styles.sectionCount}>{pinnedEvents.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pinnedScroll}
            >
              {pinnedEvents.map(event => (
                <View key={event.id} style={styles.pinnedCard}>
                  <EventCard event={event} compact />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Upcoming (7 days) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Next 7 Days</Text>
          </View>
          <Text style={styles.sectionCount}>{next7Days.length}</Text>
        </View>
        {next7Days.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No upcoming events"
            subtitle="Tap + to add your first event"
          />
        ) : (
          next7Days.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onPin={() => togglePin(event.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.primary,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  earningsBanner: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success + '33',
  },
  earningsLeft: { flexDirection: 'row', alignItems: 'center' },
  earningsLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  earningsValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pinnedScroll: { paddingRight: Spacing.md, paddingBottom: 4 },
  pinnedCard: { width: 260, marginRight: Spacing.sm },
});
