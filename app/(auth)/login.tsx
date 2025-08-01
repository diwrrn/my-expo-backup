import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { Phone, Lock, Eye, EyeOff, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  
  const { signInWithPhone, error } = useAuth();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const phoneInputScale = useRef(new Animated.Value(1)).current;
  const passwordInputScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for the gradient
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    const isValid = phoneRegex.test(phone);
    setPhoneValid(phone.length > 0 ? isValid : null);
    return isValid;
  };

  const validatePassword = (pass) => {
    const isValid = pass.length >= 6;
    setPasswordValid(pass.length > 0 ? isValid : null);
    return isValid;
  };

  const handlePhoneChange = (text) => {
    setPhoneNumber(text);
    validatePhone(text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validatePassword(text);
  };

  const handleInputFocus = (inputName) => {
    setFocusedInput(inputName);
    const scaleAnim = inputName === 'phone' ? phoneInputScale : passwordInputScale;
    
    Animated.timing(scaleAnim, {
      toValue: 1.02,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleInputBlur = (inputName) => {
    setFocusedInput(null);
    const scaleAnim = inputName === 'phone' ? phoneInputScale : passwordInputScale;
    
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
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
      
      // Button press animation
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      await signInWithPhone(phoneNumber, password);
      // Navigation will be handled by app/_layout.tsx based on onboarding status
    } catch (err) {
      Alert.alert('Login Failed', error || 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBorderColor = (inputName, isValid) => {
    if (focusedInput === inputName) {
      return '#22C55E';
    }
    if (isValid === true) {
      return '#22C55E';
    }
    if (isValid === false) {
      return '#EF4444';
    }
    return '#E5E7EB';
  };

  const getValidationIcon = (isValid) => {
    if (isValid === true) {
      return <CheckCircle size={16} color="#22C55E" />;
    }
    if (isValid === false) {
      return <XCircle size={16} color="#EF4444" />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.backgroundGradient,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#F0FDF4', '#F9FAFB', '#F3F4F6']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Animated.View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <View style={styles.titleUnderline} />
          </Animated.View>
          <Text style={styles.subtitle}>Sign in to continue tracking your nutrition</Text>
        </View>

        <View style={styles.form}>
          <Animated.View 
            style={[
              styles.inputContainer,
              {
                borderColor: getInputBorderColor('phone', phoneValid),
                shadowColor: focusedInput === 'phone' ? '#22C55E' : '#000',
                shadowOpacity: focusedInput === 'phone' ? 0.1 : 0.05,
                transform: [{ scale: phoneInputScale }],
              },
            ]}
          >
            <Phone size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              onFocus={() => handleInputFocus('phone')}
              onBlur={() => handleInputBlur('phone')}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <View style={styles.validationIcon}>
              {getValidationIcon(phoneValid)}
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              {
                borderColor: getInputBorderColor('password', passwordValid),
                shadowColor: focusedInput === 'password' ? '#22C55E' : '#000',
                shadowOpacity: focusedInput === 'password' ? 0.1 : 0.05,
                transform: [{ scale: passwordInputScale }],
              },
            ]}
          >
            <Lock size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={handlePasswordChange}
              onFocus={() => handleInputFocus('password')}
              onBlur={() => handleInputBlur('password')}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            <View style={styles.validationIcon}>
              {getValidationIcon(passwordValid)}
            </View>
          </Animated.View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
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
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#111827',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
    marginRight: 8,
  },
  validationIcon: {
    width: 20,
    alignItems: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 8,
  },
  signupText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  signupTextBold: {
    color: '#22C55E',
    fontWeight: '700',
  },
});