import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import ServiceCard from '../../components/common/ServiceCard';
import { services } from '../../constants/services';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LocationPicker from '../../components/common/LocationPicker';
import { database } from '../../config/firebase';
import { ref, update } from 'firebase/database';
import { auth } from '../../config/firebase';
import { updateUserLocation } from '../../services/userService';
import * as Location from 'expo-location';
import { getActiveServices } from '../../services/serviceService';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { handleFirebaseError } from '../../utils/errorHandler';

// Import all images at the top using ES6 imports
import carousel1 from '../../assets/images/carousel1.jpg';
import carousel2 from '../../assets/images/carousel2.jpg';
import carousel3 from '../../assets/images/carousel3.jpg';
import carousel4 from '../../assets/images/carousel4.jpg';
import carousel5 from '../../assets/images/carousel5.jpg';
import profilePlaceholder from '../../assets/images/profile-placeholder.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_HEIGHT = SCREEN_WIDTH * 0.5; // Reduced height for slides

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, initialized } = useAuth();
  const [addressDropdown, setAddressDropdown] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [location, setLocation] = useState({
    latitude: 10.3779,
    longitude: 123.6386,
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  // Carousel images array using imported images and text
  const slides = [
    {
      image: carousel1,
      title: "Professional Laundry Service",
      description: "Expert care for all your garments"
    },
    {
      image: carousel2,
      title: "Fast & Efficient",
      description: "Quick turnaround times for busy schedules"
    },
    {
      image: carousel3,
      title: "Door-to-Door Delivery",
      description: "Convenient pickup and delivery service"
    },
    {
      image: carousel4,
      title: "Quality Guaranteed",
      description: "Satisfaction guaranteed on every order"
    },
    {
      image: carousel5,
      title: "Affordable Rates",
      description: "Competitive pricing for all services"
    }
  ];

  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      if (!initialized) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Check if location services are enabled
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services in your device settings to use this feature.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => Location.openSettings(),
              },
            ]
          );
          return;
        }

        // Request permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access in your device settings to use this feature.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => Location.openSettings(),
              },
            ]
          );
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
        });

        if (mounted) {
          const newLocation = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
          setLocation(newLocation);

          // Only update Firebase if user is authenticated
          if (user?.uid) {
            try {
              await updateUserLocation(user.uid, newLocation, user);
            } catch (error) {
              console.warn('Failed to update location in Firebase:', error);
              // Don't show error to user as this is not critical
            }
          } else {
            console.warn('User not authenticated, skipping Firebase update');
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
        if (mounted) {
          Alert.alert(
            'Location Error',
            'Failed to get your location. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeLocation();

    return () => {
      mounted = false;
    };
  }, [user, initialized]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const activeServices = await getActiveServices();
        setServices(activeServices);
        setServicesError(null);
      } catch (error) {
        console.error('Error fetching services:', error);
        setServicesError(handleFirebaseError(error));
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleLocationSelect = async (locationData) => {
    try {
      setLocation(locationData);
      if (user?.uid) {
        try {
          await updateUserLocation(user.uid, locationData, user);
          Alert.alert('Success', 'Location updated successfully');
        } catch (error) {
          console.warn('Failed to update location in Firebase:', error);
          // Still show success to user as the location was updated locally
          Alert.alert('Success', 'Location updated successfully');
        }
      } else {
        console.warn('User not authenticated, skipping Firebase update');
      }
      setShowLocationPicker(false);
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? prev : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? prev : prev - 1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
      <View style={[styles.header, { backgroundColor: '#f0f8ff' }]}>
        <Text style={[styles.appName, { color: '#00bfff' }]}>Wash and Go</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconButton}
        >
          <MaterialIcons name="notifications" size={24} color="#00bfff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ backgroundColor: '#f0f8ff' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile and Address Section */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: '#00bfff' }]}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <View style={styles.addressContainer}>
            <TouchableOpacity 
              style={styles.addressButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <MaterialIcons name="location-on" size={20} color="#00bfff" />
              <Text style={[styles.addressText, { color: '#4169e1' }]} numberOfLines={1}>
                {location ? `${location.latitude}, ${location.longitude}` : 'Add your location'}
              </Text>
              <MaterialIcons 
                name="edit" 
                size={20} 
                color="#00bfff" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Slider */}
        <View style={styles.slideContainer}>
          <Image 
            source={slides[currentSlide].image} 
            style={styles.slideImage} 
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton]}
            onPress={prevSlide}
          >
            <MaterialIcons name="chevron-left" size={32} color="#00bfff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton]}
            onPress={nextSlide}
          >
            <MaterialIcons name="chevron-right" size={32} color="#00bfff" />
          </TouchableOpacity>
          <View style={styles.slideContent}>
            <Text style={[styles.slideTitle, { color: '#00bfff' }]}>{slides[currentSlide].title}</Text>
            <Text style={[styles.slideDescription, { color: '#87cefa' }]}>{slides[currentSlide].description}</Text>
          </View>
          <View style={styles.slideIndicators}>
            {slides.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.indicator,
                  index === currentSlide && styles.activeIndicator
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={[styles.sectionTitle, { color: '#00bfff' }]}>Our Services</Text>
          {servicesLoading ? (
            <LoadingIndicator message="Loading services..." />
          ) : servicesError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={24} color="#ff0000" />
              <Text style={styles.errorText}>{servicesError}</Text>
            </View>
          ) : (
            <>
              <View style={styles.servicesContainer}>
                {services.slice(0, 4).map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    onPress={() => navigation.navigate('CustomerOrderBooking', { serviceId: service.id })}
                  />
                ))}
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Services')}
              >
                <Text style={[styles.viewAllText, { color: '#00bfff' }]}>View All Services</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#00bfff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#00bfff' }]}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <MaterialIcons name="close" size={24} color="#00bfff" />
              </TouchableOpacity>
            </View>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={location}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  addressContainer: {
    flex: 1,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
  },
  slideContainer: {
    height: SLIDE_HEIGHT,
    marginBottom: 16,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  prevButton: {
    left: 16,
    transform: [{ translateY: -20 }],
  },
  nextButton: {
    right: 16,
    transform: [{ translateY: -20 }],
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  slideDescription: {
    fontSize: 14,
  },
  slideIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    opacity: 0.5,
  },
  activeIndicator: {
    opacity: 1,
  },
  servicesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HomeScreen;