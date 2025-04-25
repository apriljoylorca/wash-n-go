import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { updateUserLocation } from '../../services/userService';
import { handleLocationError } from '../../utils/errorHandler';

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(initialLocation || {
    latitude: 10.3779,
    longitude: 123.6386,
  });
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const saveLocationToFirebase = async (locationData) => {
    try {
      if (!user || !user.uid) {
        console.warn('User not authenticated, skipping Firebase save');
        return;
      }

      // Structure the location data according to userService requirements
      const formattedLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address
      };

      await updateUserLocation(user.uid, formattedLocation, user);
      onLocationSelect(formattedLocation);
      Alert.alert('Success', 'Location saved successfully');
    } catch (error) {
      console.error('Error saving location to Firebase:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error('Location services are disabled');
      }

      // Request permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000, // 10 seconds timeout
      });

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(newLocation);

      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const { street, city, region, country } = addressResponse[0];
        const formattedAddress = `${street || ''}, ${city || ''}, ${region || ''}, ${country || ''}`;
        setAddress(formattedAddress);
        setHasSelectedLocation(true);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      const handledError = handleLocationError(error);
      setErrorMsg(handledError.message);
      
      if (error.message === 'Location services are disabled') {
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
      } else if (error.message === 'Permission to access location was denied') {
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
      } else {
        Alert.alert(
          'Location Error',
          handledError.message,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setLocation(coordinate);

    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      if (addressResponse.length > 0) {
        const { street, city, region, country } = addressResponse[0];
        const formattedAddress = `${street || ''}, ${city || ''}, ${region || ''}, ${country || ''}`;
        setAddress(formattedAddress);
        setHasSelectedLocation(true);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      Alert.alert(
        'Address Error',
        'Unable to get address for selected location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCurrentLocation = async () => {
    await getCurrentLocation();
  };

  const handleSaveLocation = async () => {
    if (!hasSelectedLocation) {
      Alert.alert('Error', 'Please select a location first');
      return;
    }

    if (!isMapLoaded) {
      Alert.alert('Error', 'Please wait for the map to fully load');
      return;
    }

    const locationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      address: address,
    };

    await saveLocationToFirebase(locationData);
  };

  const handleMapReady = () => {
    setIsMapLoaded(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleCurrentLocation}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
        onMapReady={handleMapReady}
      >
        <Marker
          coordinate={location}
          title="Selected Location"
        />
      </MapView>
      
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>{address || 'Select a location on the map'}</Text>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleCurrentLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {hasSelectedLocation && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveLocation}
        >
          <Text style={styles.saveButtonText}>Save Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
  },
  addressText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  currentLocationButton: {
    backgroundColor: '#1E90FF',
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  errorContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LocationPicker; 