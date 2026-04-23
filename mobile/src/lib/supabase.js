import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhorkrljuusuiflcvmoo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob3JrcmxqdXVzdWlmbGN2bW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjEyODMsImV4cCI6MjA5MjMzNzI4M30.3UlSNsTXpPkDHUdVdc7Vq8RH1Px6TocnLmJwVCz-_wg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function translateAuthError(msg) {
  if (!msg) return 'Bir hata oluştu.';
  if (msg.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (msg.includes('Email not confirmed'))       return 'E-postanı henüz onaylamamışsın. Gelen kutunu kontrol et.';
  if (msg.includes('User already registered'))   return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
  if (msg.includes('Password should be'))        return 'Şifre en az 6 karakter olmalı.';
  if (msg.includes('rate limit'))                return 'Çok fazla deneme. Lütfen bekle.';
  if (msg.includes('invalid email'))             return 'Geçersiz e-posta adresi.';
  return msg;
}
