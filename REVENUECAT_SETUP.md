# RevenueCat Integration Setup Guide

This guide will help you set up RevenueCat's pre-built paywall in your React Native Expo app.

## Prerequisites

1. **RevenueCat Account**: Sign up at [revenuecat.com](https://revenuecat.com)
2. **App Store Connect Account**: For iOS app configuration
3. **Google Play Console Account**: For Android app configuration

## Step 1: RevenueCat Dashboard Setup

### 1.1 Create a New Project
1. Log into your RevenueCat dashboard
2. Click "New Project"
3. Enter your project name (e.g., "Meal Planning App")
4. Select your platform (iOS/Android)

### 1.2 Configure Your App
1. **iOS Setup**:
   - Enter your Bundle ID (e.g., `com.kurddev.juulaapp`)
   - Upload your App Store Connect API key
   - Add your products in App Store Connect

2. **Android Setup**:
   - Enter your Package Name (e.g., `com.kurddev.juulaapp`)
   - Upload your Google Play Console API key
   - Add your products in Google Play Console

### 1.3 Create Products
1. Go to "Products" in your RevenueCat dashboard
2. Create the following products:
   - **Monthly Premium**: `monthly_premium`
   - **Yearly Premium**: `yearly_premium`
   - **Lifetime Premium**: `lifetime_premium`

### 1.4 Create Entitlements
1. Go to "Entitlements" in your RevenueCat dashboard
2. Create an entitlement called `premium` with the following features:
   - Unlimited meal plans
   - AI-powered food recommendations
   - Advanced nutrition tracking
   - Custom workout plans
   - Priority support
   - Ad-free experience

### 1.5 Configure Paywall
1. Go to "Paywalls" in your RevenueCat dashboard
2. Create a new paywall with your subscription tiers
3. Customize the design to match your app's branding
4. Set up A/B testing if desired

## Step 2: Update API Keys

Update the API keys in `services/revenueCatService.ts`:

```typescript
const REVENUECAT_API_KEYS = {
  ios: 'your_ios_api_key_here',      // Replace with your iOS API key
  android: 'your_android_api_key_here', // Replace with your Android API key
};
```

You can find your API keys in the RevenueCat dashboard under "Project Settings" > "API Keys".

## Step 3: Configure App Store Products

### iOS (App Store Connect)
1. Go to App Store Connect
2. Select your app
3. Go to "Features" > "In-App Purchases"
4. Create the following products:
   - `monthly_premium`: Monthly subscription
   - `yearly_premium`: Annual subscription
   - `lifetime_premium`: One-time purchase

### Android (Google Play Console)
1. Go to Google Play Console
2. Select your app
3. Go to "Monetize" > "Products" > "Subscriptions"
4. Create the following products:
   - `monthly_premium`: Monthly subscription
   - `yearly_premium`: Annual subscription
   - `lifetime_premium`: One-time purchase

## Step 4: Testing

### Sandbox Testing
1. **iOS**: Use TestFlight or sandbox accounts
2. **Android**: Use internal testing or test accounts
3. Test the complete purchase flow:
   - Show paywall
   - Make purchase
   - Verify subscription status
   - Test restore purchases

### RevenueCat Dashboard Testing
1. Go to "Customers" in your RevenueCat dashboard
2. Find your test user
3. Verify subscription status and entitlements

## Step 5: Production Deployment

1. **Submit to App Stores**:
   - Ensure all products are approved
   - Test with real accounts
   - Monitor RevenueCat dashboard for issues

2. **Monitor Analytics**:
   - Track conversion rates
   - Monitor subscription metrics
   - Set up alerts for critical issues

## Usage in Your App

The RevenueCat integration is already set up in your app:

### Access Subscription Status
```typescript
import { useRevenueCat } from '@/hooks/useRevenueCat';

function MyComponent() {
  const { isSubscribed, loading, showPaywall } = useRevenueCat();
  
  if (isSubscribed) {
    // Show premium features
  } else {
    // Show upgrade prompt
  }
}
```

### Show Paywall
```typescript
const { showPaywall } = useRevenueCat();

const handleUpgrade = async () => {
  try {
    await showPaywall();
  } catch (error) {
    console.error('Paywall error:', error);
  }
};
```

### Check Subscription Status
```typescript
const { isSubscribed } = useRevenueCat();

if (isSubscribed) {
  // User has premium access
}
```

## Navigation

Users can access the subscription screen through:
- Settings > Premium Subscription
- Direct navigation to `/(tabs)/subscription`

## Troubleshooting

### Common Issues
1. **API Key Errors**: Verify your API keys are correct
2. **Product Not Found**: Ensure products are configured in both App Store/Play Console and RevenueCat
3. **Paywall Not Showing**: Check RevenueCat dashboard paywall configuration
4. **Subscription Not Detected**: Verify entitlements are properly configured

### Debug Mode
RevenueCat debug logs are enabled in development mode. Check your console for detailed logs.

## Support

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat Support](https://www.revenuecat.com/support/)
- [React Native Purchases SDK](https://github.com/RevenueCat/react-native-purchases)

## Next Steps

1. Configure your paywall design in RevenueCat dashboard
2. Set up analytics and tracking
3. Implement subscription-gated features in your app
4. Set up automated testing for subscription flows 