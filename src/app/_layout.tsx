import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';

import { KantoSplash } from '@/components/kanto-splash';
import { KantoOnboarding } from '@/components/kanto-onboarding';
import { KantoAuth } from '@/components/kanto-auth';

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

let globalAppState: 'splash' | 'onboarding' | 'auth' | 'app' = 'splash';

export default function TabLayout() {
  const [appState, setAppState] = useState<'splash' | 'onboarding' | 'auth' | 'app'>(globalAppState);

  const updateAppState = (state: 'splash' | 'onboarding' | 'auth' | 'app') => {
    globalAppState = state;
    setAppState(state);
  };

  // Expose transition function globally so index.tsx can trigger Logout
  React.useEffect(() => {
    (global as any).updateAppState = updateAppState;
  }, []);

  return (
    <ThemeProvider value={customTheme}>
      <View style={{ flex: 1, backgroundColor: '#fffdeb' }}>
        {appState === 'splash' && (
          <KantoSplash onFinish={() => updateAppState('onboarding')} />
        )}
        {appState === 'onboarding' && (
          <KantoOnboarding onFinish={() => updateAppState('auth')} />
        )}
        {appState === 'auth' && (
          <KantoAuth
            onLogin={() => {
              updateAppState('app');
            }}
          />
        )}
        {appState === 'app' && (
          <Slot />
        )}
      </View>
    </ThemeProvider>
  );
}
