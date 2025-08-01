import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/services/api';

type VerificationStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';
type VerificationPurpose = 'registration' | 'password_reset'; // ADDED

interface UsePhoneVerificationResult {
  status: VerificationStatus;
  error: string | null;
  resendTimer: number;
  verificationSuccess: boolean;
  sendCode: (phoneNumber: string, purpose?: VerificationPurpose) => Promise<void>; // ADDED optional purpose
  verifyCode: (phoneNumber: string, code: string) => Promise<boolean>;
  resendCode: (phoneNumber: string, purpose?: VerificationPurpose) => Promise<void>; // ADDED optional purpose
  resetVerification: () => void;
}

export function usePhoneVerification(): UsePhoneVerificationResult {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startResendTimer = useCallback(() => {
    setResendTimer(60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const sendCode = useCallback(async (phoneNumber: string, purpose: VerificationPurpose = 'registration') => { // ADDED purpose with default
    setStatus('sending');
    setError(null);
    setVerificationSuccess(false);
    try {
      console.log('usePhoneVerification: Calling API to send verification code for:', phoneNumber);
      
      // ADDED: Choose API method based on purpose
      const response = purpose === 'password_reset'
        ? await apiService.resetPasswordRequest(phoneNumber)
        : await apiService.sendVerificationCode(phoneNumber);
      
      if (response.success || response.data?.success) { // UPDATED: Handle both response formats
        console.log('usePhoneVerification: Code sent successfully. Response:', response);
        setStatus('sent');
        startResendTimer();
      } else {
        console.error('usePhoneVerification: Failed to send code. Error:', response.error || response.data?.error);
        setStatus('error');
        setError(response.error || response.data?.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      console.error('usePhoneVerification: Network error during code sending:', err);
      setStatus('error');
      setError(err.message || 'Network error during code sending.');
    }
  }, [startResendTimer]);

  const verifyCode = useCallback(async (phoneNumber: string, code: string): Promise<boolean> => {
    setStatus('verifying');
    setError(null);
    setVerificationSuccess(false);
    try {
      console.log('usePhoneVerification: Calling API to verify code for:', phoneNumber, 'Code:', code);
      const response = await apiService.verifyPhoneCode(phoneNumber, code);
      
      if (response.success || response.data?.success) { // UPDATED: Handle both response formats
        console.log('usePhoneVerification: Code verified successfully. Response:', response);
        setStatus('verified');
        setVerificationSuccess(true);
        return true;
      } else {
        console.error('usePhoneVerification: Invalid verification code. Error:', response.error || response.data?.error);
        setStatus('error');
        setError(response.error || response.data?.error || 'Invalid verification code.');
        setVerificationSuccess(false);
        return false;
      }
    } catch (err: any) {
      console.error('usePhoneVerification: Network error during code verification:', err);
      setStatus('error');
      setError(err.message || 'Network error during code verification.');
      setVerificationSuccess(false);
      return false;
    }
  }, []);

  const resendCode = useCallback(async (phoneNumber: string, purpose: VerificationPurpose = 'registration') => { // ADDED purpose with default
    if (resendTimer === 0) {
      console.log('usePhoneVerification: Resending code for:', phoneNumber);
      await sendCode(phoneNumber, purpose); // UPDATED: Pass purpose
    } else {
      console.log(`usePhoneVerification: Cannot resend, timer active: ${resendTimer}s`);
      setError(`Please wait ${resendTimer} seconds before resending.`);
    }
  }, [resendTimer, sendCode]);

  const resetVerification = useCallback(() => {
    console.log('usePhoneVerification: Resetting verification state.');
    setStatus('idle');
    setError(null);
    setResendTimer(0);
    setVerificationSuccess(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  return {
    status,
    error,
    resendTimer,
    verificationSuccess,
    sendCode,
    verifyCode,
    resendCode,
    resetVerification,
  };
}
