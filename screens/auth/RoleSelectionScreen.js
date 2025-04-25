import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import DecorativeBubbles from '../../components/common/DecorativeBubbles';

const RoleSelectionScreen = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    { id: 'customer', title: 'Customer', description: 'I want to use laundry services' },
    { id: 'driver', title: 'Driver', description: 'I want to deliver laundry orders' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
      <DecorativeBubbles />
      <View style={styles.content}>
        <Text style={styles.title}>Wash and Go</Text>
        <Text style={styles.subtitle}>Choose your role to continue</Text>
        
        <View style={styles.roleContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.selectedRoleCard,
              ]}
              onPress={() => setSelectedRole(role.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedRole === role.id }}
              accessibilityLabel={`${role.title} - ${role.description}`}
            >
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedRole && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Register', { role: selectedRole })}
          >
            <Text style={styles.buttonText}>Proceed</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f8ff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 18,
    color: '#87cefa',
    marginBottom: 75,
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 75,
  },
  roleCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRoleCard: {
    borderWidth: 2,
    borderColor: '#6495ed',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  roleIcon: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#87cefa',
    fontFamily: 'Helvetica',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#6495ed',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 200,
    fontFamily: 'Helvetica',
  },
  linkContainer: {
    marginTop: 10,
  },
  linkText: {
    color: '#1e90ff',
    fontSize: 16,
    fontFamily: 'Helvetica',
  },
  keyboardAvoidView: {
    flex: 1,
  },
});

export default RoleSelectionScreen;