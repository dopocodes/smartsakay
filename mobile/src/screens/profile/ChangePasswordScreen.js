import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { usersAPI } from '../../api/services';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const ChangePasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useFeedback();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const validate = () => {
    const e = {};
    if (!currentPassword) e.currentPassword = 'Enter your current password';
    if (!newPassword) {
      e.newPassword = 'Enter a new password';
    } else if (!hasMinLength || !hasLower || !hasUpper || !hasNumber) {
      e.newPassword = 'Password must meet all complexity requirements below';
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      e.newPassword = 'New password must be different from current password';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await usersAPI.changePassword({
        currentPassword,
        newPassword,
      });

      showSuccess('Password Updated!', 'Your account password has been changed successfully.');
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password. Please check your current password.';
      setServerError(msg);
      showError('Password Change Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderRequirement = (label, fulfilled) => (
    <View style={styles.requirementRow}>
      <MaterialCommunityIcons
        name={fulfilled ? 'check-circle' : 'circle-outline'}
        size={16}
        color={fulfilled ? '#10B981' : colors.textMuted}
      />
      <Text
        style={[
          styles.requirementText,
          { color: fulfilled ? '#10B981' : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Update Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ensure your account is using a secure password
          </Text>
        </View>

        {serverError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{serverError}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setErrors((prev) => ({ ...prev, currentPassword: null }));
              setServerError('');
            }}
            secureTextEntry
            leftIcon="lock-outline"
            error={errors.currentPassword}
          />

          <Input
            label="New Password"
            placeholder="Create new password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors((prev) => ({ ...prev, newPassword: null }));
              setServerError('');
            }}
            secureTextEntry
            leftIcon="lock-plus-outline"
            error={errors.newPassword}
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-type new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: null }));
              setServerError('');
            }}
            secureTextEntry
            leftIcon="lock-check-outline"
            error={errors.confirmPassword}
          />

          {newPassword.length > 0 && (
            <View style={[styles.requirementsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.requirementsTitle, { color: colors.textPrimary }]}>
                Password Requirements:
              </Text>
              {renderRequirement('At least 8 characters', hasMinLength)}
              {renderRequirement('At least one uppercase letter (A-Z)', hasUpper)}
              {renderRequirement('At least one lowercase letter (a-z)', hasLower)}
              {renderRequirement('At least one number (0-9)', hasNumber)}
              {renderRequirement('Passwords match', passwordsMatch)}
            </View>
          )}

          <Button
            title="Update Password"
            onPress={handleChangePassword}
            loading={loading}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  requirementsCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    gap: 6,
  },
  requirementsTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  requirementText: {
    fontSize: FONTS.sizes.xs,
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  cancelText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
});

export default ChangePasswordScreen;
