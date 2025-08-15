import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Phone, Lock, Eye, EyeOff, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/ctx';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);  
  const { signIn } = useSession();

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    const isValid = phoneRegex.test(phone);
    setPhoneValid(phone.length > 0 ? isValid : null);
    return isValid;
  };
  
  const validatePassword = (pass: string) => {
    const isValid = pass.length >= 6;
    setPasswordValid(pass.length > 0 ? isValid : null);
    return isValid;
  };
  
  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    validatePhone(text);
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    validatePassword(text);
  };

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    if (!validatePhone(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
  
    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
  
    try {
      setIsLoading(true);
      await signIn(`+964${phoneNumber}`, password);
      // Navigation will be handled by app/_layout.tsx based on onboarding status
    } catch (err) {
      Alert.alert('Login Failed', 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>🥗</Text>
          </View>
          <Text style={styles.appName}>NutriTrack</Text>
        </View>
        
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to continue your nutrition journey
          </Text>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <View style={styles.formContainer}>
          {/* Phone Input */}
          <View style={styles.inputGroup}>
  <Text style={styles.inputLabel}>Phone Number</Text>
  <View 
    style={[
      styles.inputContainer,
      {
        backgroundColor: focusedInput === 'phone' ? '#FFFFFF' : '#FAFBFC',
      }
    ]}
  >
    <View style={styles.inputIconContainer}>
      <Phone size={18} color="#6B7280" />
    </View>
    <Text style={styles.phonePrefix}>+964</Text>
    <TextInput
      style={styles.input}
      placeholder="7_ _ _ _ _ _ _ _ _"
      placeholderTextColor="#9CA3AF"
      value={phoneNumber}
      onChangeText={handlePhoneChange}
      onFocus={() => setFocusedInput('phone')}
      onBlur={() => setFocusedInput(null)}
      keyboardType="phone-pad"
      autoComplete="tel"
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
                  backgroundColor: focusedInput === 'password' ? '#FFFFFF' : '#FAFBFC',
                }
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Lock size={18} color="#6B7280" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#6B7280" />
                ) : (
                  <Eye size={18} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#22C55E', '#16A34A']}
              style={styles.loginButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Section - Now inside scroll */}
        <View style={styles.footerSection}>
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity
            style={styles.signupContainer}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              Don't have an account? 
              <Text style={styles.signupTextBold}> Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
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
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
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
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  validationIconContainer: {
    width: 20,
    alignItems: 'center',
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    shadowOpacity: 0.05,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
});