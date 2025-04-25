import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useError } from '../../context/ErrorContext';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import DecorativeBubbles from '../../components/common/DecorativeBubbles';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../../config/firebase';
import { handleFirebaseError } from '../../utils/errorHandler';

const SignInScreen = () => {
  const navigation = useNavigation();
  const { showError } = useError();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const fetchUserData = async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User data not found');
      }

      const userData = snapshot.val();
      
      // Validate user role
      if (!['customer', 'driver'].includes(userData.role)) {
        throw new Error('Invalid user role for mobile app');
      }

      // Check if user is active
      if (userData.role === 'driver' && !userData.isActive) {
        throw new Error('Your account is currently inactive');
      }

      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('Attempting to sign in with email:', credentials.email);
      
      // Ensure Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email.trim(),
        credentials.password
      );
      
      if (!userCredential || !userCredential.user) {
        throw new Error('Authentication failed');
      }

      console.log('Firebase Auth successful, user:', userCredential.user.uid);
      
      // 2. Fetch user data from Realtime Database
      const userData = await fetchUserData(userCredential.user.uid);
      
      if (!userData || !userData.role) {
        throw new Error('Invalid user data');
      }

      // 3. Role-based navigation
      if (userData.role === 'driver') {
        // Instead of replacing, we'll let the RootNavigator handle the navigation
        // The RootNavigator will automatically show the correct stack based on the user's role
        navigation.reset({
          index: 0,
          routes: [{ name: 'Root' }],
        });
      } else if (userData.role === 'customer') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Root' }],
        });
      } else {
        throw new Error('Invalid user role for mobile app');
      }

    } catch (error) {
      console.error('Sign in error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/api-key-not-valid') {
        errorMessage = 'Authentication service error. Please try again later.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.message.includes('Firebase Auth is not initialized')) {
        errorMessage = 'Authentication service error. Please restart the app.';
      } else if (error.message.includes('Invalid user role')) {
        errorMessage = 'This account is not accessible through the mobile app.';
      } else if (error.message.includes('inactive')) {
        errorMessage = 'Your account is currently inactive. Please contact support.';
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIndicator overlay message="Signing in..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.mainContent}>
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>Welcome back! Please sign in to continue</Text>
              
              <DecorativeBubbles />
              
              <InputField
                label="Email"
                value={credentials.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                style={{ marginBottom: 15 }}
              />
              
              <InputField
                label="Password"
                value={credentials.password}
                onChangeText={(text) => handleInputChange('password', text)}
                placeholder="Enter your password"
                secureTextEntry
                error={errors.password}
                style={{ marginBottom: 5 }}
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotPasswordText, { color: '#87cefa' }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              
              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                style={styles.signInButton}
              />
            </View>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: '#87cefa' }]}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                <Text style={[styles.registerLink, { color: '#1e90ff' }]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 16,
    color: '#87cefa',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  signInButton: {
    backgroundColor: '#6495ed',
    marginTop: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 5,
  },
  registerText: {
    fontSize: 15,
    fontFamily: 'Helvetica',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
  },
});

export default SignInScreen;