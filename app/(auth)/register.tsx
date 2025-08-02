import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Lock, User, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import { apiService } from '@/services/api';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Phone verification states
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneNumberVerified, setIsPhoneNumberVerified] = useState(false);
  const [phoneVerificationStatus, setPhoneVerificationStatus] = useState('');

  const { signUpWithPhoneVerification, error: authError } = useAuth();
  const {
    status: phoneVerificationHookStatus,
    error: phoneVerificationHookError,
    resendTimer,
    verificationSuccess,
    sendCode,
    verifyCode,
    resendCode,
    resetVerification,
  } = usePhoneVerification();

  const keyboard = useAnimatedKeyboard();
  const [isTouching, setIsTouching] = useState(false);
  
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      marginTop: withTiming(
        !isTouching && keyboard.height.value > 50 ? -keyboard.height.value / 2 : 0,
        { duration: 250 }
      ),
      paddingBottom: withTiming(
        !isTouching && keyboard.height.value > 50 ? keyboard.height.value / 2 + 20 : 20,
        { duration: 250 }
      ),
    };
  });

  // Update local verification status based on hook's status
  useEffect(() => {
    console.log('RegisterScreen: phoneVerificationHookStatus changed:', phoneVerificationHookStatus);
    if (phoneVerificationHookStatus === 'sent') {
      setVerificationSent(true);
      setPhoneVerificationStatus('Code sent! Check your phone.');
    } else if (phoneVerificationHookStatus === 'verified') {
      setIsPhoneNumberVerified(true);
      setPhoneVerificationStatus('Phone number verified successfully!');
    } else if (phoneVerificationHookStatus === 'error') {
      setPhoneVerificationStatus(phoneVerificationHookError || 'An error occurred.');
    } else if (phoneVerificationHookStatus === 'idle') {
      setVerificationSent(false);
      setIsPhoneNumberVerified(false);
      setPhoneVerificationStatus('');
    }
  }, [phoneVerificationHookStatus, phoneVerificationHookError]);

  const validatePhoneNumberFormat = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    console.log('RegisterScreen: Verify button clicked.');
    console.log('RegisterScreen: Phone number:', phoneNumber);
    const isValidFormat = validatePhoneNumberFormat(phoneNumber);
    console.log('RegisterScreen: Phone number format valid:', isValidFormat);
  
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }
    if (!isValidFormat) {
      Alert.alert('Error', 'Please enter a valid phone number format.');
      return;
    }
    
    setPhoneVerificationStatus('Checking phone number...');
    
    try {
      // Check if phone number already exists
      console.log('RegisterScreen: Checking if phone exists...'); // ADD THIS
      const checkResult = await apiService.checkPhoneExists(phoneNumber);
      console.log('RegisterScreen: Phone check result:', checkResult); // ADD THIS
      
      if (checkResult.data.exists) {
        console.log('RegisterScreen: Phone already exists, showing alert'); // ADD THIS
        setPhoneVerificationStatus(''); // Clear status
        Alert.alert(
          'Phone Already Registered', 
          'This phone number is already registered. Please use a different number or sign in instead.',
          [
            { text: 'Try Different Number', style: 'default' },
            { text: 'Sign In Instead', style: 'default', onPress: () => router.push('/(auth)/login') }
          ]
        );
        return; // MAKE SURE THIS STOPS EXECUTION
      }
      
      console.log('RegisterScreen: Phone available, proceeding with verification'); // ADD THIS
      // Phone number is available, proceed with verification
      setPhoneVerificationStatus('Sending code...');
      console.log('RegisterScreen: Calling sendCode hook...');
      await sendCode(phoneNumber);
      console.log('RegisterScreen: sendCode hook call finished.');
      
    } catch (error) {
      console.error('RegisterScreen: Error checking phone existence:', error);
      Alert.alert('Error', 'Failed to verify phone number availability. Please try again.');
      setPhoneVerificationStatus('');
    }
  };


  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }
    
    setPhoneVerificationStatus('Verifying code...');
    const success = await verifyCode(phoneNumber, verificationCode);
    if (!success) {
      Alert.alert('Verification Failed', phoneVerificationHookError || 'Invalid code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setPhoneVerificationStatus('Resending code...');
    await resendCode(phoneNumber);
  };

  const handleRegister = async () => {
    console.log('RegisterScreen: handleRegister called.');
    if (!name || !phoneNumber || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isPhoneNumberVerified) {
      Alert.alert('Error', 'Please verify your phone number first.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      console.log('RegisterScreen: Calling signUpWithPhoneVerification...');
      await signUpWithPhoneVerification(phoneNumber, name, password);
      console.log('RegisterScreen: signUpWithPhoneVerification completed successfully.');
      // Navigation will be handled by app/_layout.tsx (always to onboarding for new users)
    } catch (err) {
      console.error('RegisterScreen: Registration error caught:', err);
      Alert.alert('Registration Failed', authError || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your nutrition tracking journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" style={styles.inputIcon} />
              <Text style={styles.phonePrefix}>+964</Text>
                <TextInput
                  style={styles.input}
                  placeholder="7XX XXX XXXX"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (isPhoneNumberVerified) {
                    setIsPhoneNumberVerified(false);
                    resetVerification();
                  }
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!verificationSent || isPhoneNumberVerified}
              />
              {isPhoneNumberVerified && (
                <CheckCircle size={20} color="#22C55E" style={styles.verificationIcon} />
              )}
            </View>
            
            {!isPhoneNumberVerified && !verificationSent && (
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  !validatePhoneNumberFormat(phoneNumber) && styles.verifyButtonDisabled,
                  phoneVerificationHookStatus === 'sending' && styles.verifyButtonLoading,
                ]}
                onPress={handleSendCode}
                disabled={!validatePhoneNumberFormat(phoneNumber) || phoneVerificationHookStatus === 'sending'}
              >
                <Text style={styles.verifyButtonText}>
                  {phoneVerificationHookStatus === 'sending' ? 'Sending...' : 'Verify'}
                </Text>
              </TouchableOpacity>
            )}

            {verificationSent && !isPhoneNumberVerified && (
              <View style={styles.verificationCodeContainer}>
                <Text style={styles.verificationStatusText}>{phoneVerificationStatus}</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[
                      styles.verifyButtonSmall,
                      phoneVerificationHookStatus === 'verifying' && styles.verifyButtonLoading,
                    ]}
                    onPress={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || phoneVerificationHookStatus === 'verifying'}
                  >
                    <Text style={styles.verifyButtonText}>
                      {phoneVerificationHookStatus === 'verifying' ? 'Verifying...' : 'Verify Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.resendContainer}>
                  <Text style={styles.resendTimerText}>Resend in {resendTimer}s</Text>
                  <TouchableOpacity
                    style={[
                      styles.resendButton,
                      resendTimer > 0 && styles.resendButtonDisabled,
                    ]}
                    onPress={handleResendCode}
                    disabled={resendTimer > 0}
                  >
                    <Text style={styles.resendButtonText}>Resend Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (isLoading || !isPhoneNumberVerified) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading || !isPhoneNumberVerified}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
    style={styles.loginLink}
    onPress={() => router.push('/login')}
  >
    <Text style={styles.loginText}>
      Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
    </Text>
  </TouchableOpacity>
        </View> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingTop: 60,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 10,
  },
  inputGroup: {
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phonePrefix: { /* ADDED STYLE */
    fontSize: 16,
    color: '#9CA3AF', // Grayed out
    fontWeight: '500',
    marginRight: 8, // Space between prefix and input
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 4,
  },
  verificationIcon: {
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  verifyButtonLoading: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonSmall: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  verificationCodeContainer: {
    marginTop: 15,
    gap: 10,
  },
  verificationStatusText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  resendTimerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginTextBold: {
    color: '#22C55E',
    fontWeight: '600',
  },
});
