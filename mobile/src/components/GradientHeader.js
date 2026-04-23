import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient, spacing } from '../lib/theme';

export default function GradientHeader({ children, style }) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, style]}
    >
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxl + 12,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  inner: {
    gap: 4,
  },
});
