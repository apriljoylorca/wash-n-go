import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showError = (message, duration = 3000) => {
    setError(message);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setError(null));
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && (
        <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </ErrorContext.Provider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    elevation: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});

export function useError() {
  return useContext(ErrorContext);
}
