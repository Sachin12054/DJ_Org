import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DJEvent } from '../types/Event';
import { Colors, BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '../constants/theme';
import PaymentBar from './PaymentBar';
import PriorityBadge from './PriorityBadge';

interface Props {
  event: DJEvent;
  onPin?: () => void;
  compact?: boolean;
}

export default function EventCard({ event, onPin, compact = false }: Props) {
  const router = useRouter();

  const priorityBorderColor = {
    high: Colors.priorityHigh,
    medium: Colors.priorityMedium,
    low: Colors.priorityLow,
  }[event.priority];

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(event.eventDate).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isPast = new Date(event.eventDate) < new Date() && event.status === 'upcoming';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: priorityBorderColor }, Shadow.sm]}
      onPress={() => router.push(`/event/${event.id}` as any)}
      activeOpacity={0.75}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eventName} numberOfLines={1}>
            {event.eventName}
          </Text>
          <View style={styles.clientRow}>
            <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.clientName}>{event.clientName}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {event.isPinned && (
            <Ionicons name="bookmark" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
          )}
          {onPin && (
            <TouchableOpacity onPress={onPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={event.isPinned ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={event.isPinned ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date & Location */}
      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
        <Text style={[styles.metaText, isPast && styles.overdue]}>
          {formattedDate} · {formattedTime}
        </Text>
      </View>
      {!compact && !!event.location && (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Payment + Priority */}
      <View style={styles.footerRow}>
        <View style={styles.paymentBlock}>
          <Text style={styles.amount}>
            ₹{event.totalAmount.toLocaleString('en-IN')}
          </Text>
          {event.remainingAmount > 0 && (
            <Text style={styles.remaining}>
              ₹{event.remainingAmount.toLocaleString('en-IN')} due
            </Text>
          )}
          {!compact && (
            <PaymentBar total={event.totalAmount} paid={event.advancePaid} mini />
          )}
        </View>
        <PriorityBadge priority={event.priority} />
      </View>

      {/* Status badge for completed/cancelled */}
      {event.status !== 'upcoming' && (
        <View style={[styles.statusBadge, event.status === 'completed' ? styles.completedBadge : styles.cancelledBadge]}>
          <Text style={styles.statusText}>
            {event.status === 'completed' ? '✓ Completed' : '✕ Cancelled'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    borderLeftWidth: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  titleBlock: { flex: 1, marginRight: Spacing.sm },
  eventName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0.2,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  clientName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  overdue: { color: Colors.warning },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  paymentBlock: { flex: 1, marginRight: Spacing.sm },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  remaining: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  completedBadge: { backgroundColor: Colors.successBg },
  cancelledBadge: { backgroundColor: Colors.errorBg },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
});
