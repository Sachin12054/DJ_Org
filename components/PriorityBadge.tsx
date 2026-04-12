import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { Priority } from '../types/Event';

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
}

const config: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: '🔴 HIGH', color: Colors.priorityHigh, bg: Colors.priorityHighBg },
  medium: { label: '🟡 MEDIUM', color: Colors.priorityMedium, bg: Colors.priorityMediumBg },
  low: { label: '🟢 LOW', color: Colors.priorityLow, bg: Colors.priorityLowBg },
};

export default function PriorityBadge({ priority, size = 'sm' }: Props) {
  const { label, color, bg } = config[priority];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.text, { color }, size === 'md' && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: { paddingHorizontal: 12, paddingVertical: 5 },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  textMd: { fontSize: FontSize.sm },
});
