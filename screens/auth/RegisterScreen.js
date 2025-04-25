import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import DecorativeBubbles from '../../components/common/DecorativeBubbles';
import { registerUser } from '../../services/authService';
import { Colors } from '../../constants/colors';

const RegisterScreen = ({ route }) => {
  const navigation = useNavigation();
  const { role } = route.params;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^09\d{9}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid Philippine mobile number (e.g., 09123456789)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        ...formData,
        role,
      };
      
      await registerUser(userData);
      Alert.alert(
        'Success',
        'Registration successful! Please sign in to continue.',
        [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <DecorativeBubbles />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fast, Fresh, and Hassle-free Laundry!</Text>

            <InputField
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              error={errors.firstName}
              placeholder="Enter your first name"
              leftIcon="person"
              style={{ marginBottom: 15 }}
            />

            <InputField
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              error={errors.lastName}
              placeholder="Enter your last name"
              leftIcon="person"
              style={{ marginBottom: 15 }}
            />

            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              error={errors.email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email"
              style={{ marginBottom: 15 }}
            />

            <InputField
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              error={errors.phoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              leftIcon="phone"
              style={{ marginBottom: 15 }}
            />

            <InputField
              label="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              error={errors.password}
              placeholder="Enter your password"
              secureTextEntry
              leftIcon="lock"
              style={{ marginBottom: 15 }}
            />

            <InputField
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              leftIcon="lock"
              style={{ marginBottom: 15 }}
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              style={{ backgroundColor: Colors.primary }}
            />

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('SignIn')}
            >
              <Text style={[styles.registerText, { color: Colors.secondary }]}>
                Already have an account?
              </Text>
              <Text style={[styles.registerLink, { color: Colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.primary,
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.secondary,
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 5,
  },
  registerText: {
    fontSize: 16,
    fontFamily: 'Helvetica',
  },
  registerLink: {
    fontSize: 16,
    fontFamily: 'Helvetica',
  },
});

export default RegisterScreen;