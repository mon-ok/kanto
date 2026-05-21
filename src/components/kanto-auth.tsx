import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { BrandColors } from '@/constants/theme';

interface KantoAuthProps {
  onLogin: () => void;
}

const GoogleG = () => (
  <View style={styles.googleIconContainer}>
    <Text style={styles.googleIconText}>G</Text>
  </View>
);

const PhoneIcon = () => (
  <View style={styles.phoneIconContainer}>
    <Text style={styles.phoneIconText}>📱</Text>
  </View>
);

export function KantoAuth({ onLogin }: KantoAuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign up states
  const [signupStep, setSignupStep] = useState<'options' | 'phone_input' | 'otp_verify'>('options');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = () => {
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1500);
  };

  const handleGoogleSignup = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1500);
  };

  const handleSendOtp = () => {
    setError('');
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSignupStep('otp_verify');
    }, 1200);
  };

  const handleVerifyOtp = () => {
    setError('');
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1500);
  };

  const handleGuestAccess = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  const toggleMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    // Reset signup state when switching tabs
    setSignupStep('options');
    setPhoneNumber('');
    setOtpCode('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Brand Header - will remain fully static in place during tab toggle */}
        <View style={styles.header}>
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

        {/* Tab Toggle Switch */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.activeTab]}
            onPress={() => toggleMode('login')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.activeTab]}
            onPress={() => toggleMode('signup')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Auth Form Card */}
        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {mode === 'login' ? (
            // --- LOG IN TAB ---
            <View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#8ca0ab"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#8ca0ab"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity style={styles.forgotButton} disabled={loading} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={BrandColors.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Log In</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // --- SIGN UP TAB ---
            <View>
              {signupStep === 'options' && (
                <View>
                  <Text style={styles.cardInfoText}>
                    Join Kanto to easily find and secure parking spaces. Select how you want to sign up:
                  </Text>

                  {/* Google Signup Button */}
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignup}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color={BrandColors.navy} size="small" />
                    ) : (
                      <View style={styles.buttonWithIcon}>
                        <GoogleG />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Phone Signup Button */}
                  <TouchableOpacity
                    style={styles.phoneButton}
                    onPress={() => setSignupStep('phone_input')}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonWithIcon}>
                      <PhoneIcon />
                      <Text style={styles.phoneButtonText}>Continue with Phone</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {signupStep === 'phone_input' && (
                <View>
                  <Text style={styles.formTitle}>Sign Up with Phone</Text>
                  
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+1 (555) 000-0000"
                      placeholderTextColor="#8ca0ab"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoFocus
                      editable={!loading}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color={BrandColors.white} size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Send Verification Code</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setSignupStep('options');
                      setError('');
                    }}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backButtonText}>Back to options</Text>
                  </TouchableOpacity>
                </View>
              )}

              {signupStep === 'otp_verify' && (
                <View>
                  <Text style={styles.formTitle}>Verify Verification Code</Text>
                  <Text style={styles.cardSubtitleText}>
                    We sent a 6-digit code to {phoneNumber}
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Verification Code</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="000000"
                      placeholderTextColor="#8ca0ab"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      editable={!loading}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color={BrandColors.white} size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Verify & Create Account</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setSignupStep('phone_input');
                      setError('');
                      setOtpCode('');
                    }}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backButtonText}>Back to Phone entry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Secondary Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestAccess}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 85,
    height: 100,
    marginBottom: 6,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: BrandColors.charcoal,
    letterSpacing: 4,
    fontFamily: 'System',
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(38, 63, 79, 0.08)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: BrandColors.teal,
    // Add simple shadow for elevated active tab look
    shadowColor: BrandColors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.navy,
    fontFamily: 'System',
  },
  activeTabText: {
    color: BrandColors.white,
  },
  card: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    minHeight: 310,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    // Soft shadow
    shadowColor: BrandColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardInfoText: {
    fontSize: 14,
    color: BrandColors.navy,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  cardSubtitleText: {
    fontSize: 13,
    color: BrandColors.navy,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.navy,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.navy,
    marginBottom: 6,
    fontFamily: 'System',
  },
  input: {
    backgroundColor: BrandColors.white,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: BrandColors.charcoal,
    fontFamily: 'System',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: BrandColors.navy,
    fontWeight: '600',
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: BrandColors.teal,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  googleButton: {
    backgroundColor: BrandColors.white,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    color: BrandColors.navy,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'System',
  },
  phoneButton: {
    backgroundColor: BrandColors.navy,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneButtonText: {
    color: BrandColors.white,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'System',
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleIconText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4285F4', // Google Blue
  },
  phoneIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  phoneIconText: {
    fontSize: 15,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 13,
    color: BrandColors.navy,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  guestButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  guestButtonText: {
    color: BrandColors.orange,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
});
