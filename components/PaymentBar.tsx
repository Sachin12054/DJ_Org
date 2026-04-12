import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface Props {
  total: number;
  paid: number;
  mini?: boolean;
}

export default function PaymentBar({ total, paid, mini = false }: Props) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const remaining = total - paid;
  const isFullyPaid = remaining <= 0;

  const barColor = isFullyPaid
    ? Colors.success
    : pct > 60
    ? Colors.warning
    : Colors.primary;

  if (mini) {
    return (
      <View style={styles.miniContainer}>
        <View style={styles.miniTrack}>
          <View style={[styles.miniFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Advance Paid</Text>
        <Text style={[styles.value, { color: Colors.success }]}>
          ₹{paid.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Remaining Due</Text>
        <Text style={[styles.value, { color: isFullyPaid ? Colors.success : Colors.warning }]}>
          {isFullyPaid ? 'Fully Paid ✓' : `₹${remaining.toLocaleString('en-IN')}`}
        </Text>
      </View>
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${pct}%` as any,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <Text style={styles.pct}>{Math.round(pct)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  pct: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  // Mini
  miniContainer: { marginTop: 6 },
  miniTrack: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
