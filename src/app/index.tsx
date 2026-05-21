import * as Device from 'expo-device';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, BrandColors } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroSection}>
          <Image
            source={require('@/assets/images/kanto-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.appName}>KANTO</Text>
          <Text style={styles.tagline}>
            <Text style={styles.taglineNavy}>Your Parking,</Text>{' '}
            <Text style={styles.taglineOrange}>Right Around the Corner.</Text>
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Quick Actions</Text>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="Find Parking"
            hint={<ThemedText type="small">Search nearby parking spots in real-time</ThemedText>}
          />
          <HintRow
            title="My Bookings"
            hint={<ThemedText type="small">View your current active and past reservations</ThemedText>}
          />
          <HintRow
            title="Account Settings"
            hint={<ThemedText type="small">Manage payments, profile and vehicles</ThemedText>}
          />
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: BrandColors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  logo: {
    width: 100,
    height: 118,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: BrandColors.charcoal,
    letterSpacing: 4,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'System',
  },
  taglineNavy: {
    color: BrandColors.navy,
  },
  taglineOrange: {
    color: BrandColors.orange,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: BrandColors.navy,
    letterSpacing: 1.5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    backgroundColor: BrandColors.white,
  },
});
