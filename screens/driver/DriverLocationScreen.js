import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../config/firebase';
import { ref, onValue, update, get, off } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { updateDriverLocation, updateOrderLocation } from '../../services/driverService';
import { handleFirebaseError } from '../../utils/errorHandler';
import GradientBackground from '../../components/common/GradientBackground';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const DriverLocationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { orderId } = route.params;
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [currentOrderStatus, setCurrentOrderStatus] = useState(null);

  const setupLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setDriverLocation(location);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          setDriverLocation(newLocation);
          try {
            await updateDriverLocation(user.uid, {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              timestamp: new Date().toISOString(),
              accuracy: newLocation.coords.accuracy,
              speed: newLocation.coords.speed,
              heading: newLocation.coords.heading,
            });
          } catch (error) {
            console.error('Error updating driver location:', error);
          }
        }
      );

      setLocationSubscription(subscription);
      return subscription;
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setErrorMsg(handledError.message);
      setIsLoading(false);
      return null;
    }
  }, [user]);

  const setupOrderListener = useCallback(() => {
    if (!orderId) {
      setErrorMsg('Order ID is required');
      setIsLoading(false);
      return null;
    }

    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const unsubscribe = onValue(orderRef, (snapshot) => {
        if (snapshot.exists()) {
          const orderData = snapshot.val();
          setCurrentOrderStatus(orderData.status);
          if (orderData.customerLocation) {
            setCustomerLocation(orderData.customerLocation);
          }
        }
        setIsLoading(false);
      }, (error) => {
        const handledError = handleFirebaseError(error);
        setErrorMsg(handledError.message);
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setErrorMsg(handledError.message);
      setIsLoading(false);
      return null;
    }
  }, [orderId]);

  useEffect(() => {
    let locationSub;
    let orderSub;

    const setup = async () => {
      locationSub = await setupLocationTracking();
      orderSub = setupOrderListener();
    };

    setup();

    return () => {
      if (locationSub) {
        locationSub.remove();
      }
      if (orderSub) {
        orderSub();
      }
    };
  }, [setupLocationTracking, setupOrderListener]);

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const locationSub = await setupLocationTracking();
      const orderSub = setupOrderListener();
      return () => {
        if (locationSub) {
          locationSub.remove();
        }
        if (orderSub) {
          orderSub();
        }
      };
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setErrorMsg(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [setupLocationTracking, setupOrderListener]);

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: driverLocation?.coords.latitude || 0,
          longitude: driverLocation?.coords.longitude || 0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.coords.latitude,
              longitude: driverLocation.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
          >
            <MaterialIcons name="directions-bike" size={30} color={Colors.primary} />
          </Marker>
        )}
        {customerLocation && (
          <Marker
            coordinate={{
              latitude: customerLocation.latitude,
              longitude: customerLocation.longitude,
            }}
            title="Customer Location"
            description="Customer's location"
          >
            <MaterialIcons name="location-on" size={30} color={Colors.error} />
          </Marker>
        )}
        {driverLocation && customerLocation && (
          <Polyline
            coordinates={[
              {
                latitude: driverLocation.coords.latitude,
                longitude: driverLocation.coords.longitude,
              },
              {
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
              },
            ]}
            strokeColor={Colors.primary}
            strokeWidth={2}
          />
        )}
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 10,
  },
});

export default DriverLocationScreen;