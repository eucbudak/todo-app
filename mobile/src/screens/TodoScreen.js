import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTodos } from '../hooks/useTodos';
import GradientHeader from '../components/GradientHeader';
import FilterBar from '../components/FilterBar';
import TodoItem from '../components/TodoItem';
import { colors, spacing, radius, font } from '../lib/theme';

export default function TodoScreen({ user }) {
  const { todos, load, add, toggle, remove, clearCompleted } = useTodos();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [load]);

  const onAdd = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const v = text;
    setText('');
    await add(v);
    setBusy(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
  };

  const visible = useMemo(() => {
    if (filter === 'active')    return todos.filter(t => !t.done);
    if (filter === 'completed') return todos.filter(t =>  t.done);
    return todos;
  }, [todos, filter]);

  const total     = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const leftCount = total - doneCount;

  const summaryText = total === 0
    ? 'Hiç görev yok'
    : `${total} görev · ${doneCount} tamamlandı`;

  const emptyText = filter === 'completed' ? 'Tamamlanan görev yok'
                  : filter === 'active'    ? 'Aktif görev yok'
                  :                          'Henüz görev eklenmedi';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <GradientHeader>
          <View style={styles.headerTop}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Emre'nin İş Listesi</Text>
              <Text style={styles.headerSummary}>{summaryText}</Text>
              {user?.email && <Text style={styles.headerEmail}>{user.email}</Text>}
            </View>
            <Pressable onPress={onLogout} style={styles.logoutBtn} hitSlop={8}>
              <Feather name="log-out" size={18} color={colors.white} />
            </Pressable>
          </View>
        </GradientHeader>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Yeni görev ekle..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={onAdd}
            returnKeyType="done"
            editable={!busy}
          />
          <Pressable
            onPress={onAdd}
            disabled={busy || !text.trim()}
            style={[styles.addBtn, (busy || !text.trim()) && styles.addBtnDisabled]}
          >
            <Text style={styles.addBtnText}>{busy ? '...' : 'Ekle'}</Text>
          </Pressable>
        </View>

        <FilterBar value={filter} onChange={setFilter} />

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TodoItem todo={item} onToggle={toggle} onDelete={remove} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="clipboard" size={44} color={colors.border} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
        />

        {total > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{leftCount} görev kaldı</Text>
            {doneCount > 0 && (
              <Pressable onPress={clearCompleted}>
                <Text style={styles.clearBtn}>Tamamlananları Sil</Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    color: colors.white,
    fontSize: font.size.title,
    fontWeight: font.weight.bold,
    letterSpacing: -0.5,
  },
  headerSummary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: font.size.md,
    marginTop: 4,
  },
  headerEmail: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: font.size.xs,
    marginTop: 6,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.sm + 2,
    padding: 8,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: font.size.lg,
    color: colors.text,
  },
  addBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#a5b4fc',
  },
  addBtnText: {
    color: colors.white,
    fontSize: font.size.lg,
    fontWeight: font.weight.semi,
  },

  listContent: {
    paddingHorizontal: spacing.xl,
    flexGrow: 1,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    fontSize: font.size.md,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  footerText: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
  clearBtn: {
    color: colors.primary,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
});
