import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { apiService } from '@/services/api'; // Assuming apiService is exported from services/api.ts

export default function ForgotPasswordScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';

  const [step, setStep] = useState(1); // 1: Phone input, 2: Code verification, 3: New password
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false); // Add this line

  const {
    status: phoneVerificationHookStatus,
    error: phoneVerificationHookError,
    resendTimer,
    sendCode,
    verifyCode,
    resendCode,
    resetVerification,
  } = usePhoneVerification();

  useEffect(() => {
    if (phoneVerificationHookStatus === 'sent') {
      setStep(2); // Move to verification step
      setIsLoading(false);
    } else if (phoneVerificationHookStatus === 'verified') {
      setStep(3); // Move to new password step
      setIsLoading(false);
    } else if (phoneVerificationHookStatus === 'error') {
      Alert.alert(t('common:error'), phoneVerificationHookError || 'Verification failed.');
      setIsLoading(false);
    }
  }, [phoneVerificationHookStatus, phoneVerificationHookError]);

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
      resetVerification();
      setIsLoading(false);
    } else {
      router.back();
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('common:error'), t('common:phoneNumberRequired', 'Phone number is required.'));
      return;
    }
    setIsLoading(true);
    await sendCode(phoneNumber, 'password_reset'); // Remove the success check
    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t('common:error'), t('common:verificationCodeRequired', 'Verification code is required.'));
      return;
    }
    setIsLoading(true);
    
    const success = await verifyCode(phoneNumber, verificationCode);
    if (success) {
      setIsCodeVerified(true); // ← Add this line
      setStep(3); // Move to password step
    }
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    await resendCode(phoneNumber, 'password_reset'); // Pass purpose
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    console.log('Debug - phoneNumber:', phoneNumber);
    console.log('Debug - newPassword:', newPassword);
  
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('common:error'), t('common:allFieldsRequired', 'All fields are required.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common:error'), t('common:passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common:error'), t('common:passwordTooShort', 'Password must be at least 6 characters.'));
      return;
    }
    if (!isCodeVerified) { // ← Add this check
        Alert.alert(t('common:error'), 'Please verify your phone number first.');
        setStep(2);
        return;
      }

    setIsLoading(true);
    try {
      const response = await apiService.resetPasswordConfirm(phoneNumber, newPassword);
      if (response.success) {
        Alert.alert(t('common:success'), t('common:passwordResetSuccess', 'Password reset successfully! Please log in with your new password.'));
        router.replace('/(auth)/login');
      } else {
        Alert.alert(t('common:error'), response.error || t('common:passwordResetFailed', 'Failed to reset password.'));
      }
    } catch (err) {
      Alert.alert(t('common:error'), t('common:networkError', 'Network error. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <View style={styles.iconContainer}>
              <Lock size={40} color="#22C55E" />
            </View>
            <Text style={styles.messageTitle}>
              {t('common:resetYourPassword', 'Reset Your Password')}
            </Text>
            <Text style={styles.messageText}>
              {t('common:enterPhoneNumberToReset', 'Enter your phone number to receive a verification code and reset your password.')}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('common:phoneNumber', 'Phone Number')}</Text>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <Phone size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { textAlign: getTextAlign(isRTL) }]}
                  placeholder={t('common:enterPhoneNumber', 'Enter your phone number')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? t('common:sendingCode', 'Sending Code...') : t('common:sendVerificationCode', 'Send Verification Code')}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 2:
        return (
          <>
            <View style={styles.iconContainer}>
              <Lock size={40} color="#22C55E" />
            </View>
            <Text style={styles.messageTitle}>
              {t('common:verifyYourPhone', 'Verify Your Phone')}
            </Text>
            <Text style={styles.messageText}>
              {t('common:enterCodeSentTo', 'Enter the 6-digit code sent to')} {phoneNumber}.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('common:verificationCode', 'Verification Code')}</Text>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { textAlign: getTextAlign(isRTL) }]}
                  placeholder={t('common:enter6DigitCode', 'Enter 6-digit code')}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
                {phoneVerificationHookStatus === 'verified' && (
                  <CheckCircle size={20} color="#22C55E" style={styles.inputIcon} />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? t('common:verifying', 'Verifying...') : t('common:verifyCode', 'Verify Code')}
              </Text>
            </TouchableOpacity>
            <View style={[styles.resendContainer, { flexDirection: getFlexDirection(isRTL) }]}>
              <Text style={styles.resendTimerText}>
                {t('common:resendIn', 'Resend in')} {resendTimer}s
              </Text>
              <TouchableOpacity
                style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
                onPress={handleResendCode}
                disabled={resendTimer > 0 || isLoading}
              >
                <Text style={styles.resendButtonText}>{t('common:resendCode', 'Resend Code')}</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 3:
        return (
          <>
            <View style={styles.iconContainer}>
              <Lock size={40} color="#22C55E" />
            </View>
            <Text style={styles.messageTitle}>
              {t('common:setNewPassword', 'Set New Password')}
            </Text>
            <Text style={styles.messageText}>
              {t('common:enterYourNewPassword', 'Enter your new password below.')}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('common:newPassword', 'New Password')}</Text>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { textAlign: getTextAlign(isRTL) }]}
                  placeholder={t('common:enterNewPassword', 'Enter new password')}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('common:confirmNewPassword', 'Confirm New Password')}</Text>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { textAlign: getTextAlign(isRTL) }]}
                  placeholder={t('common:confirmNewPassword', 'Confirm new password')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
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
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? t('common:resettingPassword', 'Resetting Password...') : t('common:resetPassword', 'Reset Password')}
              </Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    headerGradient: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
      padding: 24,
      paddingTop: 60,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F0FDF4',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      borderWidth: 2,
      borderColor: '#22C55E',
    },
    messageTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    messageText: {
      fontSize: 16,
      color: '#6B7280',
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 32,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    inputGroup: {
      width: '100%',
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
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
    actionButton: {
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
      marginTop: 10,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginTop: 15,
    },
    resendTimerText: {
      fontSize: 14,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient
          colors={['#F0FDF4', '#F9FAFB']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              {isRTL ? (
                <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
              ) : (
                <ArrowLeft size={24} color="#111827" />
              )}
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {step === 1 ? t('common:forgotPassword', 'Forgot Password?') :
                 step === 2 ? t('common:verifyPhone', 'Verify Phone') :
                 t('common:resetPassword', 'Reset Password')}
              </Text>
              <Text style={styles.headerSubtitle}>
                {step === 1 ? t('common:resetPasswordInstructions', 'Instructions to reset your password') :
                 step === 2 ? t('common:codeSent', 'Code sent to your phone') :
                 t('common:setNewPasswordInstructions', 'Set your new password')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
