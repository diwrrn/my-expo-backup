import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Lock, Eye, EyeOff, Save } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

export default function AccountSettingsScreen() {
  const { user, updateProfile } = useAuth();
  const isRTL = useRTL();
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Update form when user changes
  useEffect(() => {
    setName(user?.name || '');
    setPhoneNumber(user?.phoneNumber || '');
  }, [user]);

  const validateProfileForm = () => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Name is required');
    }

    if (name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }

    if (!phoneNumber.trim()) {
      errors.push('Phone number is required');
    }

    // Basic phone number validation
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.push('Please enter a valid phone number');
    }

    return errors;
  };

  const validatePasswordForm = () => {
    const errors: string[] = [];

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword) {
      errors.push('New password is required');
    }

    if (newPassword.length < 6) {
      errors.push('New password must be at least 6 characters');
    }

    if (newPassword !== confirmPassword) {
      errors.push('New passwords do not match');
    }

    if (currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }

    return errors;
  };

  const handleUpdateProfile = async () => {
    const errors = validateProfileForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      setIsProfileLoading(true);

      await updateProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = validatePasswordForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'No user is currently signed in');
      return;
    }

    try {
      setIsPasswordLoading(true);

      // Create temporary email from phone number for re-authentication
      const tempEmail = `${user?.phoneNumber?.replace(/[^\d]/g, '')}@temp.local`;
      const credential = EmailAuthProvider.credential(tempEmail, currentPassword);

      // Re-authenticate user
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again before changing your password';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
        {/* Header */}
        <View style={[styles.header, { flexDirection: getFlexDirection(isRTL) }]}>
          <TouchableOpacity 
            style={[styles.backButton, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]} 
            onPress={handleGoBack}
          >
            {isRTL ? <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} /> : <ArrowLeft size={24} color="#111827" />}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>Account Settings</Text>
            <Text style={[styles.headerSubtitle, { textAlign: getTextAlign(isRTL) }]}>Manage your account information</Text>
          </View>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>Full Name</Text>
            <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
              <User size={20} color="#6B7280" />
              <TextInput 
                style={[styles.input, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, textAlign: getTextAlign(isRTL) }]}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>Phone Number</Text>
            <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
              <Phone size={20} color="#6B7280" />
              <TextInput 
                style={[styles.input, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, textAlign: getTextAlign(isRTL) }]}
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.updateButton, isProfileLoading && styles.updateButtonDisabled, { flexDirection: getFlexDirection(isRTL) }]}
            onPress={handleUpdateProfile}
            disabled={isProfileLoading}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>
              {isProfileLoading ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Password Change Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>Change Password</Text>
          <Text style={[styles.sectionDescription, { textAlign: getTextAlign(isRTL) }]}>
            For security reasons, you'll need to enter your current password to set a new one.
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>Current Password</Text>
            <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
              <Lock size={20} color="#6B7280" />
              <TextInput 
                style={[styles.input, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, textAlign: getTextAlign(isRTL) }]}
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>New Password</Text>
            <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
              <Lock size={20} color="#6B7280" />
              <TextInput 
                style={[styles.input, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, textAlign: getTextAlign(isRTL) }]}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
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
            <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>Confirm New Password</Text>
            <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
              <Lock size={20} color="#6B7280" />
              <TextInput 
                style={[styles.input, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, textAlign: getTextAlign(isRTL) }]}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
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
            style={[styles.changePasswordButton, isPasswordLoading && styles.updateButtonDisabled, { flexDirection: getFlexDirection(isRTL) }]}
            onPress={handleChangePassword}
            disabled={isPasswordLoading}
          >
            <Lock size={20} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>
              {isPasswordLoading ? 'Changing...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityTitle}>🔒 Security Notice</Text>
          <Text style={styles.securityText}>
            • Use a strong password with at least 6 characters
          </Text>
          <Text style={styles.securityText}>
            • Don't share your password with anyone
          </Text>
          <Text style={styles.securityText}>
            • If you suspect unauthorized access, change your password immediately
          </Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 4,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 4,
  },
});