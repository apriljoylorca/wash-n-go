import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Import images at the top of the file
import slide1 from '../../assets/images/slide1.jpg';
import slide2 from '../../assets/images/slide2.jpg';
import slide3 from '../../assets/images/slide3.jpg';

const IntroductionScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Fast Laundry Service',
      description: 'Get your laundry done quickly with our express service',
      image: slide1
    },
    {
      id: 2,
      title: 'Professional Care',
      description: 'Your clothes are handled with care by our professionals',
      image: slide2
    },
    {
      id: 3,
      title: 'Door-to-Door Service',
      description: 'We pick up and deliver right to your doorstep',
      image: slide3
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? prev : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? prev : prev - 1));
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
      <Text 
        style={styles.title}
        accessibilityRole="header"
      >
        Wash and Go
      </Text>

      <View style={styles.slideContainer}>
        {/* Navigation Arrows */}
        <TouchableOpacity 
          style={[styles.navButton, styles.leftButton, { opacity: currentSlide === 0 ? 0.3 : 1 }]}
          onPress={prevSlide}
          disabled={currentSlide === 0}
        >
          <MaterialIcons name="chevron-left" size={40} color="#1e90ff" />
        </TouchableOpacity>

        {/* Current Slide */}
        <View 
          style={styles.slide}
          accessibilityLabel={`Introduction slide ${slides[currentSlide].id}: ${slides[currentSlide].title}`}
        >
          <Image 
            source={slides[currentSlide].image} 
            style={styles.slideImage} 
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.slideTitle}>
            {slides[currentSlide].title}
          </Text>
          <Text style={styles.slideText}>
            {slides[currentSlide].description}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.navButton, styles.rightButton, { opacity: currentSlide === slides.length - 1 ? 0.3 : 1 }]}
          onPress={nextSlide}
          disabled={currentSlide === slides.length - 1}
        >
          <MaterialIcons name="chevron-right" size={40} color="#1e90ff" />
        </TouchableOpacity>

        {/* Slide Indicator */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View 
              key={index}
              style={[styles.indicator, { 
                backgroundColor: index === currentSlide ? '#1e90ff' : '#87cefa',
              }]}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RoleSelection')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('SignIn')}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Already have an account? Sign in"
        >
          <Text style={styles.loginText}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
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
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
    width: '100%',
    position: 'relative',
    paddingTop: 20,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -30,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 25,
  },
  leftButton: {
    left: 10,
  },
  rightButton: {
    right: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 20,
  },
  slideImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
  },
  slideText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 24,
    color: '#87cefa',
    fontFamily: 'Helvetica',
  },
  buttonContainer: {
    padding: 20,
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
    marginTop: -30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#6495ed',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
  },
  loginText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e90ff',
    fontFamily: 'Helvetica',
    marginTop: 10,
  },
  keyboardAvoidView: {
    flex: 1,
  },
});

export default IntroductionScreen;