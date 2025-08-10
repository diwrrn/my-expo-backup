import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function AccountSettingsScreen() {
  const { user, updateProfile } = useAuth();
  
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account information</Text>
        </View>
        <TouchableOpacity 
          onPress={handleUpdateProfile} 
          style={[styles.saveButton, isProfileLoading && styles.saveButtonDisabled]}
          disabled={isProfileLoading}
        >
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <User size={22} color="#10B981" />
              <Text style={styles.cardTitle}>Profile Information</Text>
            </View>
            <Text style={styles.cardSubtitle}>Update your personal details</Text>
          </View>
          
          <View style={styles.inputGrid}>
            <View style={styles.inputRow}>
              <InputField
                icon={<User size={18} color="#64748B" />}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                label="Full Name"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputRow}>
              <InputField
                icon={<Phone size={18} color="#64748B" />}
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                label="Phone Number"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Password Change Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Lock size={22} color="#10B981" />
              <Text style={styles.cardTitle}>Change Password</Text>
            </View>
            <Text style={styles.cardSubtitle}>Update your account password for security</Text>
          </View>
          
          <View style={styles.inputGrid}>
            <View style={styles.inputRow}>
              <PasswordField
                icon={<Lock size={18} color="#64748B" />}
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                label="Current Password"
                showPassword={showCurrentPassword}
                onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            </View>
            
            <View style={styles.inputRow}>
              <PasswordField
                icon={<Lock size={18} color="#64748B" />}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                label="New Password"
                showPassword={showNewPassword}
                onToggleShow={() => setShowNewPassword(!showNewPassword)}
              />
            </View>

            <View style={styles.inputRow}>
              <PasswordField
                icon={<Lock size={18} color="#64748B" />}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                label="Confirm New Password"
                showPassword={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </View>
          </View>
        </View>

        {/* Security Notice Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <View style={styles.securityTitleRow}>
              <Shield size={22} color="#F59E0B" />
              <Text style={styles.securityTitle}>Security Guidelines</Text>
            </View>
            <Text style={styles.securitySubtitle}>Keep your account safe</Text>
          </View>
          
          <View style={styles.securityContent}>
            <View style={styles.securityItem}>
              <View style={styles.securityBullet} />
              <Text style={styles.securityText}>Use a strong password with at least 6 characters</Text>
            </View>
            <View style={styles.securityItem}>
              <View style={styles.securityBullet} />
              <Text style={styles.securityText}>Don't share your password with anyone</Text>
            </View>
            <View style={styles.securityItem}>
              <View style={styles.securityBullet} />
              <Text style={styles.securityText}>If you suspect unauthorized access, change your password immediately</Text>
            </View>
          </View>
        </View>
            
        {/* Action Buttons */}
        <TouchableOpacity 
          onPress={handleUpdateProfile} 
          style={[styles.saveButtonLarge, isProfileLoading && styles.saveButtonLargeDisabled]}
          disabled={isProfileLoading}
        >
          <Save size={20} color="#FFFFFF" style={styles.saveButtonIcon} />
          <Text style={styles.saveButtonText}>
            {isProfileLoading ? 'Updating Profile...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleChangePassword} 
          style={[styles.passwordButtonLarge, isPasswordLoading && styles.saveButtonLargeDisabled]}
          disabled={isPasswordLoading}
        >
          <Lock size={20} color="#FFFFFF" style={styles.saveButtonIcon} />
          <Text style={styles.saveButtonText}>
            {isPasswordLoading ? 'Changing Password...' : 'Change Password'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Input Field Component
const InputField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  label,
  keyboardType,
  autoCapitalize
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <View style={styles.inputIconContainer}>
        {icon}
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  </View>
);

// Password Field Component
const PasswordField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  label,
  showPassword,
  onToggleShow
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  showPassword: boolean;
  onToggleShow: () => void;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <View style={styles.inputIconContainer}>
        {icon}
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity style={styles.eyeButton} onPress={onToggleShow}>
        {showPassword ? (
          <EyeOff size={18} color="#64748B" />
        ) : (
          <Eye size={18} color="#64748B" />
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  inputGrid: {
    padding: 20,
    gap: 16,
  },
  inputRow: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  securityCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  securityHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  securityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 8,
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#B45309',
    marginTop: 2,
  },
  securityContent: {
    padding: 20,
    gap: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 8,
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  saveButtonLarge: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  passwordButtonLarge: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonLargeDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});