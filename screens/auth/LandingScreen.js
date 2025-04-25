import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../../components/common/GradientBackground';
import { Images } from '../../constants/assets';

const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation();
  
  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const bubble3Anim = useRef(new Animated.Value(0)).current;
  const bubble4Anim = useRef(new Animated.Value(0)).current;
  const bubble5Anim = useRef(new Animated.Value(0)).current;
  const bubble6Anim = useRef(new Animated.Value(0)).current;
  const bubble7Anim = useRef(new Animated.Value(0)).current;
  const bubble8Anim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      const createBubbleAnimation = (value, baseDelay) => {
        return Animated.sequence([
          Animated.delay(baseDelay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(value, {
                toValue: 1,
                duration: 4500,
                useNativeDriver: true,
              }),
              Animated.timing(value, {
                toValue: 0,
                duration: 4500,
                useNativeDriver: true,
              }),
            ])
          ),
        ]);
      };

      const createTextAnimation = () => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(textAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(textAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      // Start animations with different delays for a wave effect
      Animated.parallel([
        createBubbleAnimation(bubble1Anim, 0),
        createBubbleAnimation(bubble2Anim, 800),
        createBubbleAnimation(bubble3Anim, 1600),
        createBubbleAnimation(bubble4Anim, 2400),
        createBubbleAnimation(bubble5Anim, 3200),
        createBubbleAnimation(bubble6Anim, 2000),
        createBubbleAnimation(bubble7Anim, 2800),
        createBubbleAnimation(bubble8Anim, 3600),
        createTextAnimation(),
      ]).start();
    };

    animate();
  }, []);

  const renderBubble = (animation, size, position) => {
    const translateY = animation.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: [0, -10, -18, -22, -18, 0],
    });

    const translateX = animation.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: [0, 8, 12, 8, -8, 0],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 0.2, 0.5, 0.8, 1],
      outputRange: [0.2, 0.25, 0.3, 0.25, 0.2],
    });

    const scale = animation.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: [1, 1.05, 1.08, 1.05, 1.02, 1],
    });

    return (
      <Animated.View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            ...position,
            opacity,
            transform: [
              { translateY },
              { translateX },
              { scale },
            ],
          },
        ]}
      />
    );
  };

  const textOpacity = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <TouchableOpacity
          style={[styles.container, { backgroundColor: '#f0f8ff' }]}
          onPress={() => navigation.navigate('Introduction')}
          activeOpacity={0.9}
        >
          <View style={styles.content}>
            {/* Top section bubbles */}
            {renderBubble(bubble1Anim, 100, { top: '8%', left: '15%' })}
            {renderBubble(bubble2Anim, 90, { top: '12%', right: '20%' })}
            
            {/* Side bubbles */}
            {renderBubble(bubble3Anim, 80, { top: '35%', left: '5%' })}
            {renderBubble(bubble4Anim, 85, { top: '40%', right: '8%' })}
            
            {/* Middle-right bubble */}
            {renderBubble(bubble8Anim, 40, { top: '60%', right: '10%' })}
            
            {/* Bottom section bubbles */}
            {renderBubble(bubble5Anim, 70, { bottom: '18%', left: '25%' })}
            {renderBubble(bubble6Anim, 30, { bottom: '8%', left: '15%' })}
            {renderBubble(bubble7Anim, 20, { bottom: '6%', right: '20%' })}

            <View style={styles.logoContainer}>
              <Image 
                source={Images.logo}
                style={styles.logo} 
                resizeMode="contain"
                accessible={true}
                accessibilityLabel="Wash-n-Go logo"
              />
            </View>

            <View style={styles.bottomContainer}>
              <Animated.Text style={[
                styles.tapText,
                {
                  opacity: textOpacity,
                  color: '#1e90ff',
                }
              ]}>
                Tap screen to continue
              </Animated.Text>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logo: {
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  bubble1: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    zIndex: 3,
  },
  bubble2: {
    position: 'absolute',
    top: 180,
    left: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    zIndex: 3,
  },
  bubble3: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    zIndex: 3,
  },
  bubble4: {
    position: 'absolute',
    bottom: 200,
    left: 30,
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    zIndex: 3,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#87cefa',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  bubble8: {
    position: 'absolute',
    top: '60%',
    right: '10%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    zIndex: 3,
  },
});

export default LandingScreen;