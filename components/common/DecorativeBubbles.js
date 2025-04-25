import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const DecorativeBubbles = () => {
  const bubbles = [
    { size: 140, top: 50, left: -30, delay: 0 },
    { size: 85, top: 120, right: 20, delay: 200 },
    { size: 180, bottom: 50, left: -40, delay: 400 },
    { size: 60, top: 220, right: -30, delay: 600 },
    { size: 100, bottom: 150, right: 0, delay: 800 },
  ];

  const animations = bubbles.map(() => new Animated.Value(0));

  useEffect(() => {
    const anims = animations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(bubbles[index].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
    });

    anims.forEach(anim => anim.start());

    return () => {
      anims.forEach(anim => anim.stop());
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {bubbles.map((bubble, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              top: bubble.top,
              bottom: bubble.bottom,
              left: bubble.left,
              right: bubble.right,
              transform: [
                {
                  translateY: animations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
                {
                  scale: animations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
              opacity: animations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.4],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: '#87cefa',
  },
});

export default DecorativeBubbles; 