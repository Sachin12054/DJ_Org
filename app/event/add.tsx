import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../context/EventContext';
import { Priority, Requirement } from '../../types/Event';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function formatDateForDisplay(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isoFromParts(date: string, time: string): string {
  try {
    const [d, m, y] = date.split('/');
    const [h, min] = time.split(':');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
    return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  } catch { return new Date().toISOString(); }
}

// ─── DateTime Picker Modal ────────────────────────────────────────────────────

function DateTimeModal({
  visible,
  onClose,
  onConfirm,
  initialDate,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (iso: string) => void;
  initialDate: string;
}) {
  const d = initialDate ? new Date(initialDate) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  const [date, setDate] = useState(
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  );
  const [time, setTime] = useState(`${pad(d.getHours())}:${pad(d.getMinutes())}`);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Select Date & Time</Text>

        <Text style={styles.fieldLabel}>Date (DD/MM/YYYY)</Text>
        <TextInput
          style={styles.modalInput}
          value={date}
          onChangeText={setDate}
          placeholder="25/12/2026"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.fieldLabel}>Time (HH:MM, 24-hr)</Text>
        <TextInput
          style={styles.modalInput}
          value={time}
          onChangeText={setTime}
          placeholder="18:30"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalConfirm}
            onPress={() => {
              onConfirm(isoFromParts(date, time));
              onClose();
            }}
          >
            <Text style={styles.modalConfirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Date Field ───────────────────────────────────────────────────────────────

function DateField({
  label,
  value,
  onChange,
  icon = 'calendar-outline',
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setOpen(true)}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
        <Text style={[styles.dateBtnText, !value && { color: Colors.textMuted }]}>
          {value ? formatDateForDisplay(value) : 'Tap to select'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      <DateTimeModal
        visible={open}
        onClose={() => setOpen(false)}
        onConfirm={onChange}
        initialDate={value || new Date().toISOString()}
      />
    </>
  );
}

// ─── Priority Selector ────────────────────────────────────────────────────────

const PRIORITIES: { key: Priority; label: string; color: string; icon: string }[] = [
  { key: 'low', label: 'Low', color: Colors.priorityLow, icon: '🟢' },
  { key: 'medium', label: 'Medium', color: Colors.priorityMedium, icon: '🟡' },
  { key: 'high', label: 'High', color: Colors.priorityHigh, icon: '🔴' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { addEvent, updateEvent, getEventById } = useEvents();

  const isEdit = !!params.id;
  const existing = isEdit ? getEventById(params.id!) : undefined;

  // Form state
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isPinned, setIsPinned] = useState(false);
  const [notes, setNotes] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newReq, setNewReq] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill for edit
  useEffect(() => {
    if (existing) {
      setEventName(existing.eventName);
      setClientName(existing.clientName);
      setPhone(existing.phone);
      setLocation(existing.location);
      setEventDate(existing.eventDate);
      setReminderDate(existing.reminderDate);
      setTotalAmount(String(existing.totalAmount));
      setAdvancePaid(String(existing.advancePaid));
      setPriority(existing.priority);
      setIsPinned(existing.isPinned);
      setNotes(existing.notes);
      setRequirements(existing.requirements);
    }
  }, [existing]);

  const remaining = Math.max(0, (Number(totalAmount) || 0) - (Number(advancePaid) || 0));

  const addRequirement = () => {
    if (!newReq.trim()) return;
    setRequirements(prev => [...prev, { id: generateId(), text: newReq.trim(), checked: false }]);
    setNewReq('');
  };

  const removeRequirement = (id: string) => {
    setRequirements(prev => prev.filter(r => r.id !== id));
  };

  const toggleRequirement = (id: string) => {
    setRequirements(prev =>
      prev.map(r => r.id === id ? { ...r, checked: !r.checked } : r)
    );
  };

  const handleSave = async () => {
    if (!eventName.trim()) { Alert.alert('Required', 'Event name is required'); return; }
    if (!clientName.trim()) { Alert.alert('Required', 'Client name is required'); return; }
    if (!eventDate) { Alert.alert('Required', 'Event date is required'); return; }

    setSaving(true);
    try {
      const payload = {
        eventName: eventName.trim(),
        clientName: clientName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        eventDate,
        reminderDate: reminderDate || eventDate,
        totalAmount: Number(totalAmount) || 0,
        advancePaid: Number(advancePaid) || 0,
        priority,
        isPinned,
        notes: notes.trim(),
        requirements,
        status: 'upcoming' as const,
      };

      if (isEdit && params.id) {
        await updateEvent(params.id, payload);
      } else {
        await addEvent(payload);
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );

  const inputStyle = (focused?: boolean) => [styles.input, focused && styles.inputFocused];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Event' : 'New Event'}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Basic Info */}
          <Text style={styles.sectionTitle}>🎉 Event Details</Text>
          <Field label="Event Name *">
            <TextInput
              style={styles.input}
              value={eventName}
              onChangeText={setEventName}
              placeholder="e.g. Wedding Reception"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
          <Field label="Client Name *">
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Full name"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
          <Field label="Contact Number">
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="Location">
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Venue name & city"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>

          {/* ── Date & Time */}
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          <View style={styles.field}>
            <DateField label="Event Date & Time *" value={eventDate} onChange={setEventDate} />
          </View>
          <View style={styles.field}>
            <DateField
              label="Reminder Date & Time"
              value={reminderDate}
              onChange={setReminderDate}
              icon="alarm-outline"
            />
          </View>

          {/* ── Payment */}
          <Text style={styles.sectionTitle}>💰 Payment</Text>
          <View style={styles.twoCol}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Total Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={totalAmount}
                onChangeText={setTotalAmount}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Advance Paid (₹)</Text>
              <TextInput
                style={styles.input}
                value={advancePaid}
                onChangeText={setAdvancePaid}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.remainingBox}>
            <Text style={styles.remainingLabel}>Remaining Amount</Text>
            <Text style={[styles.remainingValue, { color: remaining > 0 ? Colors.warning : Colors.success }]}>
              ₹{remaining.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* ── Priority & Pin */}
          <Text style={styles.sectionTitle}>📌 Priority & Pin</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.priorityChip,
                  { borderColor: p.color },
                  priority === p.key && { backgroundColor: p.color + '25' },
                ]}
                onPress={() => setPriority(p.key)}
              >
                <Text style={{ fontSize: FontSize.md }}>{p.icon}</Text>
                <Text style={[
                  styles.priorityChipText,
                  { color: priority === p.key ? p.color : Colors.textSecondary }
                ]}>
                  {p.label}
                </Text>
                {priority === p.key && (
                  <Ionicons name="checkmark-circle" size={14} color={p.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.pinToggle, isPinned && styles.pinToggleActive]}
            onPress={() => setIsPinned(!isPinned)}
          >
            <Ionicons
              name={isPinned ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isPinned ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.pinText, isPinned && { color: Colors.primary }]}>
              {isPinned ? 'Pinned to Dashboard' : 'Pin to Dashboard'}
            </Text>
          </TouchableOpacity>

          {/* ── Requirements Checklist */}
          <Text style={styles.sectionTitle}>📋 Requirements</Text>
          <View style={styles.reqInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newReq}
              onChangeText={setNewReq}
              placeholder="Add a requirement…"
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={addRequirement}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.reqAddBtn} onPress={addRequirement}>
              <Ionicons name="add" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {requirements.map(req => (
            <View key={req.id} style={styles.reqItem}>
              <TouchableOpacity onPress={() => toggleRequirement(req.id)}>
                <Ionicons
                  name={req.checked ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={req.checked ? Colors.success : Colors.textMuted}
                />
              </TouchableOpacity>
              <Text style={[styles.reqText, req.checked && styles.reqChecked]}>{req.text}</Text>
              <TouchableOpacity onPress={() => removeRequirement(req.id)}>
                <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {/* ── Notes */}
          <Text style={styles.sectionTitle}>🗒 Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes about the event…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.bottomSaveBtn, saving && { opacity: 0.6 }, Shadow.primary]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name={isEdit ? 'save' : 'add-circle'} size={20} color={Colors.text} />
            <Text style={styles.bottomSaveBtnText}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  field: { marginBottom: Spacing.sm },
  fieldLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  inputFocused: { borderColor: Colors.primary },
  notesInput: { height: 100 },
  twoCol: { flexDirection: 'row' },
  remainingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  remainingLabel: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  remainingValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
  },
  priorityChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  pinToggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  pinText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  reqInputRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  reqAddBtn: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reqText: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  reqChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  dateBtnText: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 2,
    marginTop: Spacing.xl,
  },
  bottomSaveBtnText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.modalBackground,
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalCancel: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  modalConfirm: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: { color: Colors.text, fontWeight: FontWeight.bold },
});
