import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Lock, User, Eye, EyeOff, Check, Clock, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';

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
  const [focusedInput, setFocusedInput] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Ref for hidden input
  const hiddenInputRef = useRef(null);

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

  // Update local verification status based on hook's status
  useEffect(() => {
    if (phoneVerificationHookStatus === 'sent') {
      setVerificationSent(true);
      setShowVerificationModal(true);
      setPhoneVerificationStatus('Code sent! Check your phone.');
    } else if (phoneVerificationHookStatus === 'verified') {
      setIsPhoneNumberVerified(true);
      setShowVerificationModal(false);
      setVerificationSent(false);
      setVerificationCode('');
      setPhoneVerificationStatus('Phone number verified successfully!');
    } else if (phoneVerificationHookStatus === 'error') {
      setPhoneVerificationStatus(phoneVerificationHookError || 'An error occurred.');
    } else if (phoneVerificationHookStatus === 'idle') {
      setVerificationSent(false);
      setIsPhoneNumberVerified(false);
      setShowVerificationModal(false);
      setPhoneVerificationStatus('');
    }
  }, [phoneVerificationHookStatus, phoneVerificationHookError]);

  const validatePhoneNumberFormat = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    const isValidFormat = validatePhoneNumberFormat(phoneNumber);
  
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
      const checkResult = await apiService.checkPhoneExists(`+964${phoneNumber}`);
      
      if (checkResult.data.exists) {
        setPhoneVerificationStatus('');
        Alert.alert(
          'Phone Already Registered', 
          'This phone number is already registered. Please use a different number or sign in instead.',
          [
            { text: 'Try Different Number', style: 'default' },
            { text: 'Sign In Instead', style: 'default', onPress: () => router.push('/(auth)/login') }
          ]
        );
        return;
      }
      
      setPhoneVerificationStatus('Sending code...');
      await sendCode(`+964${phoneNumber}`);
      
    } catch (error) {
      console.error('RegisterScreen: Error checking phone existence:', error);
      Alert.alert('Error', 'Failed to verify phone number availability. Please try again.');
      setPhoneVerificationStatus('');
    }
  };

  const handleVerifyCode = async (code) => {
    if (!code || code.length !== 6) return;
    
    setPhoneVerificationStatus('Verifying code...');
    const success = await verifyCode(`+964${phoneNumber}`, code);
    if (!success) {
      Alert.alert('Verification Failed', phoneVerificationHookError || 'Invalid code. Please try again.');
      setVerificationCode(''); // Clear code on error
    }
  };

  const handleCodeChange = (text) => {
    // Only allow digits and max 6 characters
    const cleanedText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setVerificationCode(cleanedText);
    
    // Auto-verify when 6 digits are entered
    if (cleanedText.length === 6) {
      handleVerifyCode(cleanedText);
    }
  };

  const handleChangeNumber = () => {
    setShowVerificationModal(false);
    setVerificationSent(false);
    setVerificationCode('');
    resetVerification();
  };

  const handleResendCode = async () => {
    setPhoneVerificationStatus('Resending code...');
    await resendCode(`+964${phoneNumber}`);
  };

  const handleRegister = async () => {
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
      await signUpWithPhoneVerification(`+964${phoneNumber}`, name, password);
    } catch (err) {
      console.error('RegisterScreen: Registration error caught:', err);
      Alert.alert('Registration Failed', authError || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const isBasicInfoComplete = name && password && confirmPassword && password === confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Create Account</Text>
          <Text style={styles.welcomeSubtitle}>
            Start your nutrition tracking journey
          </Text>
        </View>
      </View>

      {/* Form Section */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View 
              style={[
                styles.inputContainer,
                {
                  borderColor: focusedInput === 'name' ? '#22C55E' : '#E2E8F0',
                  backgroundColor: focusedInput === 'name' ? '#FFFFFF' : '#FAFBFC',
                }
              ]}
            >
              <View style={styles.inputIconContainer}>
                <User size={18} color="#6B7280" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View 
              style={[
                styles.inputContainer,
                {
                  borderColor: focusedInput === 'password' ? '#22C55E' : '#E2E8F0',
                  backgroundColor: focusedInput === 'password' ? '#FFFFFF' : '#FAFBFC',
                }
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Lock size={18} color="#6B7280" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#6B7280" />
                ) : (
                  <Eye size={18} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View 
              style={[
                styles.inputContainer,
                {
                  borderColor: focusedInput === 'confirmPassword' ? '#22C55E' : 
                             password && confirmPassword && password !== confirmPassword ? '#EF4444' : '#E2E8F0',
                  backgroundColor: focusedInput === 'confirmPassword' ? '#FFFFFF' : '#FAFBFC',
                }
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Lock size={18} color="#6B7280" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color="#6B7280" />
                ) : (
                  <Eye size={18} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
            {password && confirmPassword && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}
          </View>

          {/* Phone Number Input - Now always visible */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View 
              style={[
                styles.inputContainer,
                {
                  borderColor: focusedInput === 'phone' ? '#22C55E' : isPhoneNumberVerified ? '#22C55E' : '#E2E8F0',
                  backgroundColor: focusedInput === 'phone' ? '#FFFFFF' : isPhoneNumberVerified ? '#F0FDF4' : '#FAFBFC',
                }
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Phone size={18} color="#6B7280" />
              </View>
              <Text style={styles.phonePrefix}>+964</Text>
              <TextInput
                style={styles.input}
                placeholder="7XX XXX XXXX"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (isPhoneNumberVerified) {
                    setIsPhoneNumberVerified(false);
                    resetVerification();
                  }
                }}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!verificationSent || isPhoneNumberVerified}
              />
              
              {/* Verify Button inside input - Show when not verified and not sent */}
              {!isPhoneNumberVerified && !verificationSent && (
                <TouchableOpacity
                  style={[
                    styles.inlineVerifyButton,
                    !validatePhoneNumberFormat(phoneNumber) && styles.inlineVerifyButtonDisabled
                  ]}
                  onPress={handleSendCode}
                  disabled={!validatePhoneNumberFormat(phoneNumber) || phoneVerificationHookStatus === 'sending'}
                >
                  <Text style={styles.inlineVerifyButtonText}>
                    {phoneVerificationHookStatus === 'sending' ? 'Sending...' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Success Icon */}
              {isPhoneNumberVerified && (
                <View style={styles.validationIconContainer}>
                  <Check size={16} color="#22C55E" />
                </View>
              )}
            </View>

            {/* Verification Success */}
            {isPhoneNumberVerified && (
              <View style={styles.successContainer}>
                <Check size={16} color="#22C55E" />
                <Text style={styles.successText}>Phone number verified!</Text>
              </View>
            )}
          </View>

          {/* Verification Code Section - Remove from main form */}

          {/* Create Account Button - Now always visible */}
          <TouchableOpacity
            style={[
              styles.createAccountButton,
              (!isPhoneNumberVerified || isLoading) && styles.createAccountButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isPhoneNumberVerified || isLoading}
          >
            <LinearGradient
              colors={(!isPhoneNumberVerified || isLoading) ? ['#9CA3AF', '#6B7280'] : ['#22C55E', '#16A34A']}
              style={styles.createAccountGradient}
            >
              <Text style={styles.createAccountButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isPhoneNumberVerified && (
            <View style={styles.disabledNotice}>
              <Text style={styles.disabledNoticeText}>
                Complete phone verification to create your account
              </Text>
            </View>
          )}

          {/* Footer Section - Now inside scroll */}
          <View style={styles.footerSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity
              style={styles.signupContainer}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.signupText}>
                Already have an account? 
                <Text style={styles.signupTextBold}> Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Verification Code Modal */}
      {showVerificationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Phone Number</Text>
              <Text style={styles.modalSubtitle}>
                We sent a 6-digit code to +964{phoneNumber}
              </Text>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <View style={styles.codeInputContainer}>
                  <TextInput
                    style={styles.codeInput}
                    value={verificationCode}
                    onChangeText={handleCodeChange}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus={true}
                    textContentType="oneTimeCode"
                    placeholder="000000"
                    placeholderTextColor="#9CA3AF"
                    textAlign="center"
                  />
                </View>
              </View>

              {phoneVerificationHookStatus === 'verifying' && (
                <View style={styles.verifyingContainer}>
                  <Text style={styles.verifyingText}>Verifying...</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.changeNumberButton}
                  onPress={handleChangeNumber}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeNumberText}>Change Number</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    resendTimer > 0 && styles.resendButtonDisabled,
                  ]}
                  onPress={handleResendCode}
                  disabled={resendTimer > 0}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={14} color={resendTimer > 0 ? "#9CA3AF" : "#22C55E"} />
                  <Text style={[
                    styles.resendButtonText,
                    resendTimer > 0 && styles.resendButtonTextDisabled
                  ]}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  // Form Section
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  inputIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  phonePrefix: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  validationIconContainer: {
    width: 20,
    alignItems: 'center',
    marginLeft: 8,
  },

  // Inline Verify Button
  inlineVerifyButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  inlineVerifyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  inlineVerifyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Success Container
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 6,
  },
  successText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },

  // Verification Section
  verificationSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  verificationText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },
  verifyCodeButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCodeButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  verifyCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContent: {
    gap: 20,
  },
  codeInputContainer: {
    marginTop: 8,
  },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#111827',
  },
  verifyingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  verifyingText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeNumberButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changeNumberText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  resendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },

  // Create Account Button
  createAccountButton: {
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountButtonDisabled: {
    shadowOpacity: 0.05,
  },
  createAccountGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Disabled Notice
  disabledNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledNoticeText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Footer Section - Now inside scroll
  footerSection: {
    paddingTop: 32,
    gap: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  signupContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signupText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  signupTextBold: {
    color: '#22C55E',
    fontWeight: '700',
  },

  // Error Text
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
});