import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import TodoScreen from './src/screens/TodoScreen';
import { colors } from './src/lib/theme';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);

  // Oturumu yükle + auth event dinle
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) setPendingEmail(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Deep link handler (e-posta onay linki)
  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = new URLSearchParams(fragment);
      const access_token  = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  let screen;
  if (session) {
    screen = <TodoScreen user={session.user} />;
  } else if (pendingEmail) {
    screen = <ConfirmScreen email={pendingEmail} onBack={() => setPendingEmail(null)} />;
  } else {
    screen = <AuthScreen onPendingConfirm={setPendingEmail} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
