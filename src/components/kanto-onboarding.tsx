import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { BrandColors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface KantoOnboardingProps {
  onFinish: () => void;
}

// Reusable Stylized P2P Community Map Background
const BackgroundMap = () => (
  <View style={styles.bgMapWrapper} pointerEvents="none">
    {/* Street Paths */}
    <View style={[styles.bgStreet, { top: '20%', left: 0, right: 0, height: 18, transform: [{ rotate: '-12deg' }] }]} />
    <View style={[styles.bgStreet, { top: '65%', left: 0, right: 0, height: 24, transform: [{ rotate: '8deg' }] }]} />
    <View style={[styles.bgStreet, { left: '30%', top: 0, bottom: 0, width: 20, transform: [{ rotate: '-15deg' }] }]} />
    <View style={[styles.bgStreet, { left: '75%', top: 0, bottom: 0, width: 16, transform: [{ rotate: '12deg' }] }]} />

    {/* Green Park Block */}
    <View style={styles.bgPark} />

    {/* Nearby Community Parking Pin Dots */}
    <View style={[styles.bgPinDot, { top: '35%', left: '15%' }]} />
    <View style={[styles.bgPinDot, { top: '22%', left: '55%' }]} />
    <View style={[styles.bgPinDot, { top: '80%', left: '42%' }]} />
    <View style={[styles.bgPinDot, { top: '55%', left: '88%' }]} />
  </View>
);

export function KantoOnboarding({ onFinish }: KantoOnboardingProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [typedText, setTypedText] = useState('');

  // Animations
  // Slide 1: Listing card scale pop and opacity
  const listingCardScale = useRef(new Animated.Value(0.75)).current;
  const listingCardOpacity = useRef(new Animated.Value(0)).current;

  // Slide 2: Ticket entry and Stamp scale
  const ticketScale = useRef(new Animated.Value(0.95)).current;
  const ticketOpacity = useRef(new Animated.Value(0)).current;
  const stampScale = useRef(new Animated.Value(1.5)).current;
  const stampOpacity = useRef(new Animated.Value(0)).current;

  // Slide 3: Reviews list cascade
  const review1Y = useRef(new Animated.Value(30)).current;
  const review1Opacity = useRef(new Animated.Value(0)).current;
  const review2Y = useRef(new Animated.Value(45)).current;
  const review2Opacity = useRef(new Animated.Value(0)).current;

  // Slide 4: Receipt slide-up and payment success checkmark spring
  const receiptY = useRef(new Animated.Value(40)).current;
  const receiptOpacity = useRef(new Animated.Value(0)).current;
  const paySuccessScale = useRef(new Animated.Value(0.6)).current;
  const paySuccessOpacity = useRef(new Animated.Value(0)).current;

  // Trigger animations based on active page
  useEffect(() => {
    // Reset all animations
    listingCardScale.setValue(0.75);
    listingCardOpacity.setValue(0);
    ticketScale.setValue(0.95);
    ticketOpacity.setValue(0);
    stampScale.setValue(1.5);
    stampOpacity.setValue(0);
    review1Y.setValue(30);
    review1Opacity.setValue(0);
    review2Y.setValue(45);
    review2Opacity.setValue(0);
    receiptY.setValue(40);
    receiptOpacity.setValue(0);
    paySuccessScale.setValue(0.6);
    paySuccessOpacity.setValue(0);

    let typingTimer: any = null;

    if (activeIndex === 0) {
      // Reset typing text
      setTypedText('');
      const fullText = 'Lahug, Cebu City';
      let charIndex = 0;
      
      // Standard timer-based typing animation (Highly robust across Web/Native)
      typingTimer = setInterval(() => {
        charIndex++;
        setTypedText(fullText.substring(0, charIndex));
        if (charIndex >= fullText.length) {
          clearInterval(typingTimer);
        }
      }, 55); // complete typing in ~900ms

      Animated.sequence([
        // Wait for typing animation to complete
        Animated.delay(1050),
        // Pop listing card into view snap-spring style
        Animated.parallel([
          Animated.timing(listingCardOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(listingCardScale, {
            toValue: 1,
            tension: 80,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else if (activeIndex === 1) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ticketOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(ticketScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(stampOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(stampScale, {
            toValue: 1,
            tension: 65,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else if (activeIndex === 2) {
      Animated.stagger(200, [
        Animated.parallel([
          Animated.timing(review1Opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(review1Y, {
            toValue: 0,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(review2Opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(review2Y, {
            toValue: 0,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else if (activeIndex === 3) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(receiptOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(receiptY, {
            toValue: 0,
            tension: 45,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(paySuccessOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(paySuccessScale, {
            toValue: 1,
            tension: 60,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    return () => {
      if (typingTimer) {
        clearInterval(typingTimer);
      }
    };
  }, [activeIndex]);

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < 4) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < 3) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  // Render Visual 1: Find P2P Parking (Lahug, Cebu Search)
  const renderVisual1 = () => {
    return (
      <View style={styles.visualContainer}>
        <BackgroundMap />

        {/* Mock App Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={[styles.searchText, !typedText && styles.placeholderText]}>
            {typedText || 'Search destination...'}
          </Text>
          {activeIndex === 0 && typedText.length < 16 && <View style={styles.cursor} />}
        </View>

        {/* Community Space Listing Mockup */}
        <Animated.View
          style={[
            styles.listingCard,
            {
              opacity: listingCardOpacity,
              transform: [{ scale: listingCardScale }],
            },
          ]}
        >
          <View style={styles.listingHeader}>
            <View style={styles.hostProfile}>
              <Text style={styles.hostProfileText}>GC</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listingTitle}>Grace's Driveway Space</Text>
              <Text style={styles.listingLocation}>Lahug, Cebu City (Near JY Square)</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified Host</Text>
            </View>
          </View>

          <View style={styles.listingDivider} />

          <View style={styles.listingDetailsRow}>
            <View style={styles.listingTags}>
              <View style={styles.listingTag}>
                <Text style={styles.listingTagText}>✓ Gate Security</Text>
              </View>
              <View style={styles.listingTag}>
                <Text style={styles.listingTagText}>✓ Sedan / SUV</Text>
              </View>
            </View>
            <View style={styles.listingPriceContainer}>
              <Text style={styles.listingPriceVal}>₱20</Text>
              <Text style={styles.listingPriceUnit}>/hr</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Render Visual 2: Book & Reserve (Lahug, Cebu)
  const renderVisual2 = () => {
    return (
      <View style={styles.visualContainer}>
        <BackgroundMap />

        <Animated.View
          style={[
            styles.ticketCard,
            {
              opacity: ticketOpacity,
              transform: [{ scale: ticketScale }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketHeaderTitle}>PARKING SPACE RESERVATION</Text>
            <View style={styles.activeIndicatorDot} />
          </View>

          {/* Ticket Information */}
          <View style={styles.ticketBody}>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Location</Text>
              <Text style={styles.ticketValue}>Grace's Driveway, Lahug Cebu</Text>
            </View>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Duration</Text>
              <Text style={styles.ticketValue}>3 Hours (P2P Rental)</Text>
            </View>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Rate</Text>
              <Text style={styles.ticketValueHighlight}>₱20.00/hr</Text>
            </View>
          </View>

          {/* Ticket Divider */}
          <View style={styles.ticketDivider}>
            <View style={styles.ticketCutLeft} />
            <View style={styles.ticketCutRight} />
          </View>

          {/* Reserved stamp */}
          <View style={styles.ticketFooter}>
            <Animated.View
              style={[
                styles.stampContainer,
                {
                  opacity: stampOpacity,
                  transform: [{ scale: stampScale }],
                },
              ]}
            >
              <Text style={styles.stampText}>RESERVED</Text>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Render Visual 3: Trusted & Verified Community Reviews
  const renderVisual3 = () => {
    return (
      <View style={styles.visualContainer}>
        <BackgroundMap />

        <View style={styles.reviewsList}>
          {/* Review Item 1 */}
          <Animated.View
            style={[
              styles.reviewItemCard,
              {
                opacity: review1Opacity,
                transform: [{ translateY: review1Y }],
              },
            ]}
          >
            <View style={styles.reviewUserHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.avatarText}>KT</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewUserName}>Kenneth T. • Cebu Driver</Text>
                <Text style={styles.reviewStars}>⭐⭐⭐⭐⭐</Text>
              </View>
            </View>
            <Text style={styles.reviewText}>
              "Super secure gated garage. Host in Lahug was very accommodating and my SUV fit perfectly."
            </Text>
          </Animated.View>

          {/* Review Item 2 */}
          <Animated.View
            style={[
              styles.reviewItemCard,
              {
                opacity: review2Opacity,
                transform: [{ translateY: review2Y }],
                marginTop: 12,
              },
            ]}
          >
            <View style={styles.reviewUserHeader}>
              <View style={[styles.reviewAvatar, { backgroundColor: BrandColors.orange }]}>
                <Text style={styles.avatarText}>ML</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewUserName}>Maria L. • Cebu Resident</Text>
                <Text style={styles.reviewStars}>⭐⭐⭐⭐⭐</Text>
              </View>
            </View>
            <Text style={styles.reviewText}>
              "Much cheaper and safer than parking on the streets of Lahug! Will book again."
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  // Render Visual 4: Tap to Pay
  const renderVisual4 = () => {
    return (
      <View style={styles.visualContainer}>
        <BackgroundMap />

        <Animated.View
          style={[
            styles.receiptCard,
            {
              opacity: receiptOpacity,
              transform: [{ translateY: receiptY }],
            },
          ]}
        >
          <Text style={styles.receiptTitle}>Payment Method</Text>

          <View style={styles.paymentOptions}>
            <View style={styles.paymentRow}>
              <Image
                source={require('@/assets/images/gcash.png')}
                style={styles.paymentLogo}
                contentFit="contain"
              />
              <Text style={styles.paymentName}>GCash</Text>
              <View style={styles.radioSelected} />
            </View>

            <View style={styles.paymentRow}>
              <Image
                source={require('@/assets/images/paymaya.png')}
                style={styles.paymentLogo}
                contentFit="contain"
              />
              <Text style={styles.paymentName}>Maya</Text>
              <View style={styles.radioUnselected} />
            </View>
          </View>

          <View style={styles.receiptAmountRow}>
            <Text style={styles.receiptTotalLabel}>Total Paid</Text>
            <Text style={styles.receiptTotalValue}>₱60.00</Text>
          </View>

          {/* Success Checkmark overlay */}
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: paySuccessOpacity,
                transform: [{ scale: paySuccessScale }],
              },
            ]}
          >
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successText}>Payment Successful</Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Abstract Background Shapes for Premium Depth */}
      <View style={styles.tealBackgroundShape} />
      <View style={styles.orangeBackgroundShape} />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {/* Slide 1 */}
        <View style={styles.slide}>
          <View style={styles.textContainer}>
            <Text style={styles.preTitle}>01 // DISCOVER</Text>
            <Text style={styles.title}>
              Find <Text style={styles.highlightTeal}>Community</Text> Parking
            </Text>
          </View>
          {renderVisual1()}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Discover driveways, private garages, and vacant spaces shared by verified hosts near your destination.
            </Text>
          </View>
        </View>

        {/* Slide 2 */}
        <View style={styles.slide}>
          <View style={styles.textContainer}>
            <Text style={styles.preTitle}>02 // BOOKING</Text>
            <Text style={styles.title}>
              Secure & <Text style={styles.highlightOrange}>Reserve</Text>
            </Text>
          </View>
          {renderVisual2()}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Secure your spot before you arrive. Choose your duration, view transparent rates, and guarantee a space.
            </Text>
          </View>
        </View>

        {/* Slide 3 */}
        <View style={styles.slide}>
          <View style={styles.textContainer}>
            <Text style={styles.preTitle}>03 // REVIEWS</Text>
            <Text style={styles.title}>
              Community <Text style={styles.highlightTeal}>Approved</Text>
            </Text>
          </View>
          {renderVisual3()}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Find spaces with confidence. Check star ratings, detailed reviews, and feedback from other drivers.
            </Text>
          </View>
        </View>

        {/* Slide 4 */}
        <View style={styles.slide}>
          <View style={styles.textContainer}>
            <Text style={styles.preTitle}>04 // PAYMENTS</Text>
            <Text style={styles.title}>
              Seamless <Text style={styles.highlightOrange}>Payments</Text>
            </Text>
          </View>
          {renderVisual4()}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Pay securely inside the app using digital wallets or cards. Skip the lines and drive right in.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.footer}>
        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.6}
        >
          <Text style={[styles.skipText, activeIndex === 3 && styles.hiddenText]}>Skip</Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={[styles.nextButton, activeIndex === 3 && styles.getStartedButton]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {activeIndex === 3 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  // Abstract shape backgrounds
  tealBackgroundShape: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: BrandColors.teal,
    opacity: 0.05,
    position: 'absolute',
    top: -60,
    right: -60,
    zIndex: 0,
  },
  orangeBackgroundShape: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: BrandColors.orange,
    opacity: 0.05,
    position: 'absolute',
    bottom: 120,
    left: -60,
    zIndex: 0,
  },
  // Stylized Background Map Styles (Clearer, less washed-out)
  bgMapWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF9F1', // A clear, warm paper map feel
    zIndex: 0,
  },
  bgStreet: {
    position: 'absolute',
    backgroundColor: '#EEF0F3', // Darker, clearer street blocks
    borderColor: '#CBD5E1',     // Stronger border line
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  bgPark: {
    position: 'absolute',
    top: '12%',
    left: '62%',
    width: 54,
    height: 64,
    backgroundColor: '#D1EAD6', // Clearer green block
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#A8DAB5',
  },
  bgPinDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0a7c6e', // Stronger teal for visible host locations
    opacity: 0.45,
  },
  scroll: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  descriptionContainer: {
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 20,
    zIndex: 1,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.orange,
    letterSpacing: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: BrandColors.navy,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.8,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Heavy',
      android: 'sans-serif-black',
      default: 'System',
    }),
  },
  highlightTeal: {
    color: BrandColors.teal,
  },
  highlightOrange: {
    color: BrandColors.orange,
  },
  description: {
    fontSize: 15,
    color: '#556b78',
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Medium',
      android: 'sans-serif',
      default: 'System',
    }),
  },
  visualContainer: {
    width: SCREEN_WIDTH * 0.86,
    height: SCREEN_HEIGHT * 0.36,
    maxHeight: 290,
    backgroundColor: BrandColors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    padding: 16,
    zIndex: 1,
  },

  // Slide 1 visuals: Search and Listing
  searchBarWrapper: {
    width: '90%',
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'absolute',
    top: 16,
    zIndex: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchText: {
    fontSize: 13,
    color: BrandColors.charcoal,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Medium',
      android: 'sans-serif',
      default: 'System',
    }),
  },
  placeholderText: {
    color: '#94a3b8',
  },
  cursor: {
    width: 2,
    height: 14,
    backgroundColor: BrandColors.teal,
    marginLeft: 2,
  },
  listingCard: {
    width: '94%',
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    padding: 12,
    marginTop: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostProfile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  hostProfileText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.navy,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  listingLocation: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Medium',
      android: 'sans-serif',
      default: 'System',
    }),
  },
  verifiedBadge: {
    backgroundColor: 'rgba(10, 124, 110, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: BrandColors.teal,
    fontSize: 8,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  listingDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 10,
  },
  listingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTags: {
    flexDirection: 'row',
  },
  listingTag: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  listingTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  listingPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  listingPriceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: BrandColors.orange,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Heavy',
      android: 'sans-serif-black',
      default: 'System',
    }),
  },
  listingPriceUnit: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Medium',
      android: 'sans-serif',
      default: 'System',
    }),
  },

  // Slide 2 visuals: Reservation Ticket
  ticketCard: {
    width: '84%',
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  ticketHeader: {
    backgroundColor: BrandColors.navy,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketHeaderTitle: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  activeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.orange,
  },
  ticketBody: {
    padding: 12,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketLabel: {
    fontSize: 11,
    color: '#8ca0ab',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  ticketValue: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.charcoal,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  ticketValueHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.teal,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Heavy',
      android: 'sans-serif-black',
      default: 'System',
    }),
  },
  ticketDivider: {
    height: 1.5,
    backgroundColor: BrandColors.navy,
    borderStyle: 'dashed',
    marginVertical: 2,
    position: 'relative',
  },
  ticketCutLeft: {
    position: 'absolute',
    left: -10,
    top: -7,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BrandColors.white,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    zIndex: 2,
  },
  ticketCutRight: {
    position: 'absolute',
    right: -10,
    top: -7,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BrandColors.white,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    zIndex: 2,
  },
  ticketFooter: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  stampContainer: {
    transform: [{ rotate: '-10deg' }],
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: BrandColors.white,
    zIndex: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stampText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Heavy',
      android: 'sans-serif-black',
      default: 'System',
    }),
  },

  // Slide 3 visuals: Reviews list
  reviewsList: {
    width: '95%',
    zIndex: 10,
  },
  reviewItemCard: {
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BrandColors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: BrandColors.white,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  reviewUserName: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.navy,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  reviewStars: {
    fontSize: 9,
    marginTop: 1,
  },
  reviewText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Medium',
      android: 'sans-serif',
      default: 'System',
    }),
  },

  // Slide 4 visuals: Payments receipt
  receiptCard: {
    width: '82%',
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    padding: 14,
    position: 'relative',
    zIndex: 10,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.navy,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  paymentOptions: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fafbfc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  paymentLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  paymentName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.charcoal,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3.5,
    borderColor: BrandColors.teal,
    backgroundColor: BrandColors.white,
  },
  radioUnselected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  receiptAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
  },
  receiptTotalLabel: {
    fontSize: 11,
    color: '#8ca0ab',
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  receiptTotalValue: {
    fontSize: 13,
    fontWeight: '900',
    color: BrandColors.navy,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Heavy',
      android: 'sans-serif-black',
      default: 'System',
    }),
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  successCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: BrandColors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  successIcon: {
    color: BrandColors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  successText: {
    color: BrandColors.navy,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },

  // Bottom footer controls
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: BrandColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 63, 79, 0.05)',
  },
  skipButton: {
    width: 75,
    justifyContent: 'center',
  },
  skipText: {
    color: '#556b78',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  hiddenText: {
    opacity: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
    backgroundColor: BrandColors.teal,
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#b2c0c7',
  },
  nextButton: {
    width: 86,
    height: 42,
    backgroundColor: BrandColors.teal,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  getStartedButton: {
    width: 114,
    backgroundColor: BrandColors.orange,
    shadowColor: BrandColors.orange,
  },
  nextButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'AvenirNext-Bold',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
});
