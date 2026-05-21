import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const Trigger = NativeTabs.Trigger as any;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[(!scheme || (scheme as string) === 'unspecified') ? 'light' : (scheme as 'light' | 'dark')];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <Trigger name="index">
        <Trigger.Label>Home</Trigger.Label>
        <Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </Trigger>

      <Trigger name="map">
        <Trigger.Label>Map</Trigger.Label>
        <Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </Trigger>

      <Trigger name="explore">
        <Trigger.Label>Explore</Trigger.Label>
        <Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </Trigger>
    </NativeTabs>
  );
}
