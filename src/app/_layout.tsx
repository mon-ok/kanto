import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { KantoSplash } from '@/components/kanto-splash';
import { KantoAuth } from '@/components/kanto-auth';
import AppTabs from '@/components/app-tabs';

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0a7c6e',
    background: '#fffdeb',
    card: '#fffdeb',
    text: '#1f1f1d',
    border: '#263f4f',
    notification: '#f29221',
  },
};

export default function TabLayout() {
  const [appState, setAppState] = useState<'splash' | 'auth' | 'app'>('splash');

  return (
    <ThemeProvider value={customTheme}>
      <View style={{ flex: 1, backgroundColor: '#fffdeb' }}>
        {appState === 'splash' && (
          <KantoSplash onFinish={() => setAppState('auth')} />
        )}
        {appState === 'auth' && (
          <KantoAuth
            onLogin={() => {
              setAppState('app');
              setTimeout(() => {
                router.replace('/map' as any);
              }, 100);
            }}
          />
        )}
        {appState === 'app' && (
          <AppTabs />
        )}
      </View>
    </ThemeProvider>
  );
}
