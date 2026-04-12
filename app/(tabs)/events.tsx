import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../context/EventContext';
import { DJEvent, EventStatus, Priority } from '../../types/Event';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import EventCard from '../../components/EventCard';
import EmptyState from '../../components/EmptyState';

type FilterTab = 'all' | EventStatus;
type SortOption = 'date_asc' | 'date_desc' | 'priority';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function EventsScreen() {
  const router = useRouter();
  const { events, togglePin, deleteEvent } = useEvents();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortOption>('date_asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filtered = useMemo(() => {
    let list = events;

    // Filter by status
    if (filter !== 'all') {
      list = list.filter(e => e.status === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        e =>
          e.eventName.toLowerCase().includes(q) ||
          e.clientName.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sort === 'date_asc') return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      if (sort === 'date_desc') return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return 0;
    });
  }, [events, filter, search, sort]);

  const handleDelete = (event: DJEvent) => {
    Alert.alert(
      'Delete Event',
      `Delete "${event.eventName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEvent(event.id) },
      ]
    );
  };

  const sortLabel: Record<SortOption, string> = {
    date_asc: 'Date ↑',
    date_desc: 'Date ↓',
    priority: 'Priority',
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="swap-vertical" size={16} color={Colors.textSecondary} />
            <Text style={styles.sortLabel}>{sortLabel[sort]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(Object.keys(sortLabel) as SortOption[]).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.sortItem, sort === opt && styles.sortItemActive]}
              onPress={() => { setSort(opt); setShowSortMenu(false); }}
            >
              <Text style={[styles.sortItemText, sort === opt && styles.sortItemTextActive]}>
                {sortLabel[opt]}
              </Text>
              {sort === opt && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, clients, locations…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.chip, filter === tab.key && styles.chipActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.chipText, filter === tab.key && styles.chipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Count */}
      <Text style={styles.countText}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</Text>

      {/* ── List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPin={() => togglePin(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={search ? 'No results found' : 'No events yet'}
            subtitle={search ? 'Try a different search term' : 'Tap + to schedule your first event'}
          />
        }
      />

      {/* ── FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadow.primary]}
        onPress={() => router.push('/event/add' as any)}
      >
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  sortMenu: {
    position: 'absolute',
    right: Spacing.md,
    top: 75,
    zIndex: 100,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 40,
  },
  sortItemActive: { backgroundColor: Colors.primaryGlow },
  sortItemText: { fontSize: FontSize.md, color: Colors.textSecondary },
  sortItemTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
