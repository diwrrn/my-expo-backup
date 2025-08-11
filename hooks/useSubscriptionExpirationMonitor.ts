// hooks/useSubscriptionExpirationMonitor.ts
import { useState, useEffect, useRef } from 'react';
import { CustomerInfo } from 'react-native-purchases';

interface ExpirationMonitorResult {
  isExpired: boolean;
  timeUntilExpiry: number | null;
}

export const useSubscriptionExpirationMonitor = (
  customerInfo: CustomerInfo | null,
  onExpirationDetected?: () => void
): ExpirationMonitorResult => {
  const [isExpired, setIsExpired] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const premium = customerInfo?.entitlements?.active?.premium;
    
    if (!premium?.expirationDate) {
      setIsExpired(false);
      setTimeUntilExpiry(null);
      return;
    }

    const expirationTime = new Date(premium.expirationDate).getTime();
    
    const updateExpirationStatus = () => {
      const currentTime = Date.now();
      const timeDiff = expirationTime - currentTime;
      
      setTimeUntilExpiry(timeDiff);
      setIsExpired(timeDiff <= 0);
      
      return timeDiff;
    };

    // Initial check
    const initialTimeDiff = updateExpirationStatus();

    if (initialTimeDiff > 0) {
      // Update every minute for UI countdown
      intervalRef.current = setInterval(() => {
        const timeDiff = updateExpirationStatus();
        
        // If expired, trigger refresh
        if (timeDiff <= 0) {
          console.log('🚨 Subscription expired, refreshing status...');
          if (onExpirationDetected) {
            onExpirationDetected();
          }
          clearInterval(intervalRef.current!);
        }
      }, 60000); // Check every minute

      // Set exact expiration timer
      timerRef.current = setTimeout(() => {
        console.log('🚨 Subscription just expired!');
        setIsExpired(true);
        if (onExpirationDetected) {
          onExpirationDetected();
        }
      }, initialTimeDiff);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [customerInfo?.entitlements?.active?.premium?.expirationDate, onExpirationDetected]);

  return { isExpired, timeUntilExpiry };
};