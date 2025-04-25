import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setError('');
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Forgot Password</Text>
          
          <Text style={styles.subtitle}>
            Enter your email address to receive a password reset link
          </Text>
          
          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your registered email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? (
            <Text style={styles.successText}>
              Password reset email sent! Please check your inbox.
            </Text>
          ) : null}
          
          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading || success}
            style={styles.resetButton}
          />
          
          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {loading && <LoadingIndicator />}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#87cefa',
    fontFamily: 'Helvetica',
  },
  resetButton: {
    backgroundColor: '#6495ed',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Helvetica',
  },
  successText: {
    color: '#1e90ff',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Helvetica',
  },
  backToLogin: {
    alignSelf: 'center',
    marginTop: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
});

export default ForgotPasswordScreen;