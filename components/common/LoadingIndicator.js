import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/colors';

const LoadingIndicator = ({ 
  size = 'large', 
  color = Colors.primary, 
  overlay = false,
  message = '',
  backgroundColor = 'rgba(255, 255, 255, 0.8)'
}) => {
  if (!overlay) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={size} color={color} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.overlay, { backgroundColor }]}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={color} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    marginTop: 10,
    color: Colors.text,
    textAlign: 'center',
  },
});

export default LoadingIndicator;