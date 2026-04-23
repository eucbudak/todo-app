import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../lib/theme';

export default function TodoItem({ todo, onToggle, onDelete }) {
  const confirmDelete = () => {
    Alert.alert(
      'Görevi sil',
      'Bu görevi silmek istediğine emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => onDelete(todo.id) },
      ]
    );
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onToggle(todo.id, !todo.done)}
        hitSlop={8}
        style={[styles.check, todo.done && styles.checkDone]}
      >
        {todo.done && <Feather name="check" size={14} color={colors.white} />}
      </Pressable>

      <Text style={[styles.text, todo.done && styles.textDone]} numberOfLines={4}>
        {todo.text}
      </Text>

      <Pressable onPress={confirmDelete} hitSlop={8} style={styles.delete}>
        <Feather name="trash-2" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  text: {
    flex: 1,
    fontSize: font.size.lg,
    color: colors.text,
    lineHeight: 20,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  delete: {
    padding: 4,
  },
});
