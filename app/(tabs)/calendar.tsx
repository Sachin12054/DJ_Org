import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../context/EventContext';
import { DJEvent } from '../../types/Event';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function CalendarScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Build marked dates for calendar
  const { markedDates, eventsByDate } = useMemo(() => {
    const byDate: Record<string, DJEvent[]> = {};
    const marks: Record<string, any> = {};

    events.forEach(event => {
      const dateKey = event.eventDate.split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(event);
    });

    Object.keys(byDate).forEach(date => {
      const evts = byDate[date];
      const hasHigh = evts.some(e => e.priority === 'high');
      const hasMedium = evts.some(e => e.priority === 'medium');
      const dotColor = hasHigh
        ? Colors.priorityHigh
        : hasMedium
        ? Colors.priorityMedium
        : Colors.priorityLow;

      marks[date] = {
        marked: true,
        dotColor,
        ...(date === selectedDate && {
          selected: true,
          selectedColor: Colors.primaryGlow,
          selectedTextColor: Colors.primary,
        }),
      };
    });

    if (!marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: Colors.primaryGlow,
        selectedTextColor: Colors.primary,
      };
    }

    return { markedDates: marks, eventsByDate: byDate };
  }, [events, selectedDate]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Calendar */}
        <Calendar
          current={selectedDate}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: Colors.background,
            calendarBackground: Colors.surface,
            textSectionTitleColor: Colors.textSecondary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.text,
            todayTextColor: Colors.primary,
            dayTextColor: Colors.text,
            textDisabledColor: Colors.textMuted,
            dotColor: Colors.primary,
            selectedDotColor: Colors.text,
            arrowColor: Colors.primary,
            monthTextColor: Colors.text,
            indicatorColor: Colors.primary,
            textDayFontWeight: '500',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={styles.calendar}
        />

        {/* Selected date events */}
        <View style={styles.daySection}>
          <View style={styles.daySectionHeader}>
            <Text style={styles.dayLabel}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
            <Text style={styles.dayCount}>
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {selectedEvents.length === 0 ? (
            <View style={styles.noEvents}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.noEventsText}>No events on this day</Text>
            </View>
          ) : (
            selectedEvents.map(event => {
              const priorityColor = {
                high: Colors.priorityHigh,
                medium: Colors.priorityMedium,
                low: Colors.priorityLow,
              }[event.priority];

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventItem, { borderLeftColor: priorityColor }, Shadow.sm]}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                >
                  <View style={styles.eventItemLeft}>
                    <Text style={styles.eventItemTime}>
                      {new Date(event.eventDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                    <Text style={styles.eventItemName}>{event.eventName}</Text>
                    <Text style={styles.eventItemClient}>{event.clientName}</Text>
                  </View>
                  <View style={styles.eventItemRight}>
                    {event.remainingAmount > 0 && (
                      <Text style={styles.remaining}>
                        ₹{event.remainingAmount.toLocaleString('en-IN')} due
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  calendar: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  daySection: { paddingHorizontal: Spacing.md },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  dayCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  noEvents: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  noEventsText: { fontSize: FontSize.md, color: Colors.textMuted },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  eventItemLeft: { flex: 1 },
  eventItemTime: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 2 },
  eventItemName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  eventItemClient: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  eventItemRight: { alignItems: 'flex-end', gap: 4 },
  remaining: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.semibold },
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
