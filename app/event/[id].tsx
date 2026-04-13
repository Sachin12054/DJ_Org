import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../context/EventContext';
import { Requirement } from '../../types/Event';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import PaymentBar from '../../components/PaymentBar';
import PriorityBadge from '../../components/PriorityBadge';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, markStatus, deleteEvent, updateEvent, togglePin } = useEvents();
  const [editingPaid, setEditingPaid] = useState(false);
  const [paidInput, setPaidInput] = useState('');

  const event = getEventById(id);

  useEffect(() => {
    if (event) {
      setPaidInput(String(event.advancePaid));
    }
  }, [event?.id, event?.advancePaid]);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.notFoundText}>Event not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = new Date(event.eventDate).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const reminderStr = event.reminderDate
    ? new Date(event.reminderDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

  const handleCall = () => {
    if (!event.phone) { Alert.alert('No number', 'No contact number saved'); return; }
    Linking.openURL(`tel:${event.phone}`);
  };

  const handleMaps = () => {
    if (!event.location) { Alert.alert('No location', 'No location saved'); return; }
    const query = encodeURIComponent(event.location);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleWhatsApp = () => {
    if (!event.phone) { Alert.alert('No number', 'No contact number saved'); return; }
    const num = event.phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`);
  };

  const handleComplete = () => {
    Alert.alert('Mark as Completed?', `"${event.eventName}" will be moved to completed events.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => markStatus(event.id, 'completed') },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Event?', `This will cancel "${event.eventName}".`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Event', style: 'destructive', onPress: () => markStatus(event.id, 'cancelled') },
    ]);
  };

  const handleRetrieve = () => {
    Alert.alert('Retrieve Event?', `Move "${event.eventName}" back to upcoming events?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Retrieve', onPress: () => markStatus(event.id, 'upcoming') },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', `Permanently delete "${event.eventName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(event.id);
          router.back();
        },
      },
    ]);
  };

  const toggleRequirement = (reqId: string) => {
    const updated = event.requirements.map(r =>
      r.id === reqId ? { ...r, checked: !r.checked } : r
    );
    updateEvent(event.id, { requirements: updated });
  };

  const checkedCount = event.requirements.filter(r => r.checked).length;

  const priorityBorderColor = {
    high: Colors.priorityHigh,
    medium: Colors.priorityMedium,
    low: Colors.priorityLow,
  }[event.priority];

  const remainingAmount = Math.max(0, event.totalAmount - event.advancePaid);

  const handleMarkFullPaid = async () => {
    try {
      await updateEvent(event.id, { advancePaid: event.totalAmount });
      setEditingPaid(false);
    } catch {
      Alert.alert('Error', 'Could not update payment right now.');
    }
  };

  const handleSavePaidAmount = async () => {
    const parsed = Number(paidInput);

    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert('Invalid amount', 'Enter a valid paid amount.');
      return;
    }

    if (parsed > event.totalAmount) {
      Alert.alert('Invalid amount', 'Paid amount cannot be greater than total amount.');
      return;
    }

    try {
      await updateEvent(event.id, { advancePaid: parsed });
      setEditingPaid(false);
    } catch {
      Alert.alert('Error', 'Could not update paid amount.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header */}
      <View style={[styles.header, { borderBottomColor: priorityBorderColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.eventName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => togglePin(event.id)}
          >
            <Ionicons
              name={event.isPinned ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={event.isPinned ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(`/event/add?id=${event.id}` as any)}
          >
            <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Hero */}
        <View style={[styles.heroCard, { borderLeftColor: priorityBorderColor }, Shadow.md]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEventName}>{event.eventName}</Text>
              <View style={styles.heroClientRow}>
                <Ionicons name="person" size={14} color={Colors.textSecondary} />
                <Text style={styles.heroClient}>{event.clientName}</Text>
              </View>
            </View>
            <PriorityBadge priority={event.priority} size="md" />
          </View>

          {/* Status */}
          {event.status !== 'upcoming' && (
            <View style={[
              styles.statusBadge,
              event.status === 'completed' ? styles.completedBadge : styles.cancelledBadge,
            ]}>
              <Text style={styles.statusText}>
                {event.status === 'completed' ? '✓ Completed' : '✕ Cancelled'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
            <Ionicons name="call" size={20} color={Colors.text} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.whatsappBtn]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color={Colors.text} />
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.mapsBtn]} onPress={handleMaps}>
            <Ionicons name="navigate" size={20} color={Colors.text} />
            <Text style={styles.actionBtnText}>Maps</Text>
          </TouchableOpacity>
        </View>

        {/* ── Details */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Event Information</Text>
          <InfoRow icon="calendar" label="Date" value={formattedDate} />
          <InfoRow icon="time-outline" label="Time" value={formattedTime} />
          <InfoRow icon="location-outline" label="Location" value={event.location || '—'} />
          <InfoRow icon="call-outline" label="Phone" value={event.phone || '—'} />
          <InfoRow icon="alarm-outline" label="Reminder" value={reminderStr} />
        </View>

        {/* ── Payment */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Payment Breakdown</Text>
          <View style={styles.paymentHero}>
            <Text style={styles.paymentTotal}>
              ₹{event.totalAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.paymentTotalLabel}>Total Amount</Text>
          </View>

          <View style={styles.paymentStatsRow}>
            <View style={styles.paymentStatBox}>
              <Text style={styles.paymentStatLabel}>Paid</Text>
              <Text style={[styles.paymentStatValue, { color: Colors.success }]}>₹{event.advancePaid.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.paymentStatBox}>
              <Text style={styles.paymentStatLabel}>Remaining</Text>
              <Text style={[styles.paymentStatValue, { color: remainingAmount > 0 ? Colors.warning : Colors.success }]}>₹{remainingAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.paymentActionRow}>
            <TouchableOpacity style={[styles.paymentBtn, styles.fullPaidBtn]} onPress={handleMarkFullPaid}>
              <Ionicons name="checkmark-done-circle" size={18} color={Colors.text} />
              <Text style={styles.paymentBtnText}>Full Amount Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentBtn, styles.editPaidBtn]}
              onPress={() => setEditingPaid(prev => !prev)}
            >
              <Ionicons name="create-outline" size={18} color={Colors.text} />
              <Text style={styles.paymentBtnText}>{editingPaid ? 'Close' : 'Edit Paid'}</Text>
            </TouchableOpacity>
          </View>

          {editingPaid && (
            <View style={styles.editPaidWrap}>
              <Text style={styles.editPaidLabel}>Enter Paid Amount (₹)</Text>
              <View style={styles.editPaidRow}>
                <TextInput
                  style={styles.editPaidInput}
                  value={paidInput}
                  onChangeText={setPaidInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity style={styles.editPaidSaveBtn} onPress={handleSavePaidAmount}>
                  <Text style={styles.editPaidSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <PaymentBar total={event.totalAmount} paid={event.advancePaid} />
        </View>

        {/* ── Requirements */}
        {event.requirements.length > 0 && (
          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.reqHeader}>
              <Text style={styles.cardTitle}>Requirements</Text>
              <Text style={styles.reqCount}>
                {checkedCount}/{event.requirements.length}
              </Text>
            </View>
            {event.requirements.map(req => (
              <TouchableOpacity
                key={req.id}
                style={styles.reqItem}
                onPress={() => toggleRequirement(req.id)}
              >
                <Ionicons
                  name={req.checked ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={req.checked ? Colors.success : Colors.textMuted}
                />
                <Text style={[styles.reqText, req.checked && styles.reqChecked]}>
                  {req.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Notes */}
        {!!event.notes && (
          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{event.notes}</Text>
          </View>
        )}

        {/* ── Status Actions */}
        {event.status === 'upcoming' && (
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={[styles.statusBtn, styles.completeBtn, Shadow.sm]}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.text} />
              <Text style={styles.statusBtnText}>Mark as Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusBtn, styles.cancelBtn, Shadow.sm]}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle" size={20} color={Colors.text} />
              <Text style={styles.statusBtnText}>Cancel Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {event.status !== 'upcoming' && (
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={[styles.statusBtn, styles.retrieveBtn, Shadow.sm]}
              onPress={handleRetrieve}
            >
              <Ionicons name="refresh-circle" size={20} color={Colors.text} />
              <Text style={styles.statusBtnText}>Retrieve Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.deleteBtnText}>Delete Event</Text>
        </TouchableOpacity>

        <Text style={styles.meta}>
          Created {new Date(event.createdAt).toLocaleDateString('en-IN')}
          {event.updatedAt !== event.createdAt &&
            ` · Updated ${new Date(event.updatedAt).toLocaleDateString('en-IN')}`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  notFoundText: { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold },
  backLink: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 5,
    marginBottom: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroEventName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: 4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  heroClientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroClient: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  completedBadge: { backgroundColor: Colors.successBg },
  cancelledBadge: { backgroundColor: Colors.errorBg },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
  },
  callBtn: { backgroundColor: Colors.success },
  whatsappBtn: { backgroundColor: '#25D366' },
  mapsBtn: { backgroundColor: Colors.secondary },
  actionBtnText: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    gap: 8,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    width: 70,
    fontWeight: FontWeight.medium,
  },
  infoValue: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  paymentHero: { alignItems: 'center', marginBottom: Spacing.md },
  paymentTotal: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -1,
  },
  paymentTotalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  paymentStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  paymentStatBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  paymentStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  paymentStatValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  paymentActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  fullPaidBtn: { backgroundColor: Colors.success },
  editPaidBtn: { backgroundColor: Colors.secondary },
  paymentBtnText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  editPaidWrap: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  editPaidLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 6,
  },
  editPaidRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  editPaidInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  editPaidSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editPaidSaveText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reqCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  reqText: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  reqChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
  notesText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  statusActions: { gap: Spacing.sm, marginBottom: Spacing.md },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  completeBtn: { backgroundColor: Colors.success },
  cancelBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  retrieveBtn: { backgroundColor: Colors.secondary },
  statusBtnText: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + '44',
    marginBottom: Spacing.sm,
  },
  deleteBtnText: { color: Colors.error, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  meta: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});
