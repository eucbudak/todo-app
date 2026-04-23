import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { colors, spacing, radius, font } from '../lib/theme';

export default function ConfirmScreen({ email, onBack }) {
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const redirectTo = Linking.createURL('/auth-callback');
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setResending(false);
    setCooldown(60);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>E-postanı onayla</Text>
        <Text style={styles.body}>
          <Text style={styles.emailBold}>{email}</Text> adresine onay bağlantısı gönderildi.
        </Text>
        <Text style={styles.hint}>
          ⚠️ Bu e-postayı <Text style={styles.emailBold}>telefonundan</Text> açıp linke dokun —
          aksi halde bağlantı uygulamaya yönlenemez.
        </Text>

        <Pressable
          onPress={resend}
          disabled={cooldown > 0 || resending}
          style={[styles.btnSecondary, (cooldown > 0 || resending) && styles.btnDisabled]}
        >
          <Text style={styles.btnSecondaryText}>
            {resending ? 'Gönderiliyor...'
              : cooldown > 0 ? `Tekrar gönder (${cooldown}s)`
              : 'Tekrar gönder'}
          </Text>
        </Pressable>

        <Pressable onPress={onBack} style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>Giriş ekranına dön</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl + 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: {
    textAlign: 'center',
    fontSize: font.size.lg,
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  emailBold: {
    color: colors.text,
    fontWeight: font.weight.semi,
  },
  hint: {
    textAlign: 'center',
    fontSize: font.size.md,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  btnSecondary: {
    width: '100%',
    padding: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  btnSecondaryText: {
    color: colors.primary,
    fontSize: font.size.md,
    fontWeight: font.weight.semi,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnGhost: {
    padding: spacing.md - 2,
    marginTop: 4,
  },
  btnGhostText: {
    color: colors.muted,
    fontSize: font.size.md,
  },
});
