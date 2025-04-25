import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GradientBackground = ({ style }) => {
  return (
    <LinearGradient
      colors={['#ADF7F2', '#2EAAFA']}
      start={{ x: 1, y: 0 }} // top-right
      end={{ x: 0, y: 1 }}   // bottom-left
      style={[styles.background, { zIndex: -1 }, style]}
    />
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default GradientBackground;
