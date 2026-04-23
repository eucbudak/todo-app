import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase, translateAuthError } from '../lib/supabase';
import { colors, spacing, radius, font } from '../lib/theme';

export default function AuthScreen({ onPendingConfirm }) {
  const [tab, setTab]           = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);
  const [message, setMessage]   = useState(null); // { text, type }

  const clearMsg = () => setMessage(null);

  const onLogin = async () => {
    clearMsg();
    if (!email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setMessage({ text: translateAuthError(error.message), type: 'error' });
  };

  const onRegister = async () => {
    clearMsg();
    if (!email || !password) return;
    if (password.length < 6) {
      setMessage({ text: 'Şifre en az 6 karakter olmalı.', type: 'error' });
      return;
    }
    setBusy(true);
    const redirectTo = Linking.createURL('/auth-callback');
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) {
      setMessage({ text: translateAuthError(error.message), type: 'error' });
    } else {
      onPendingConfirm(email.trim());
    }
  };

  const switchTab = (next) => {
    setTab(next);
    clearMsg();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.wrapper}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logo}>
            <Feather name="calendar" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Emre'nin İş Listesi</Text>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => switchTab('login')}
              style={[styles.tab, tab === 'login' && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>
                Giriş Yap
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchTab('register')}
              style={[styles.tab, tab === 'register' && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, tab === 'register' && styles.tabLabelActive]}>
                Kayıt Ol
              </Text>
            </Pressable>
          </View>

          {message && (
            <View style={[styles.msg, msgStyles[message.type]]}>
              <Text style={[styles.msgText, msgTextStyles[message.type]]}>
                {message.text}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Şifre
              {tab === 'register' && <Text style={styles.hint}>  (en az 6 karakter)</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              editable={!busy}
            />
          </View>

          <Pressable
            onPress={tab === 'login' ? onLogin : onRegister}
            disabled={busy}
            style={[styles.btn, busy && styles.btnBusy]}
          >
            <Text style={styles.btnText}>
              {busy ? '...' : tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const msgStyles = {
  error:   { backgroundColor: colors.dangerSoft,  borderColor: '#fecaca' },
  success: { backgroundColor: colors.successSoft, borderColor: '#bbf7d0' },
  info:    { backgroundColor: '#eff6ff',          borderColor: '#bfdbfe' },
};

const msgTextStyles = {
  error:   { color: '#dc2626' },
  success: { color: colors.success },
  info:    { color: '#2563eb' },
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl + 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.borderSoft,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semi,
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  msg: {
    padding: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  msgText: {
    fontSize: font.size.md,
    lineHeight: 20,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semi,
    color: '#374151',
    marginBottom: 6,
  },
  hint: {
    fontWeight: font.weight.regular,
    color: colors.muted,
  },
  input: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: font.size.lg,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  btn: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnBusy: {
    backgroundColor: '#a5b4fc',
  },
  btnText: {
    color: colors.white,
    fontSize: font.size.lg,
    fontWeight: font.weight.semi,
  },
});
