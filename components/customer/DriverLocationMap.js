import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { database } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DriverLocationMap = ({ orderId, driverId }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  useEffect(() => {
    const driverLocationRef = ref(database, `drivers/${driverId}/location`);
    const unsubscribe = onValue(driverLocationRef, (snapshot) => {
      if (snapshot.exists()) {
        const location = snapshot.val();
        setDriverLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    });

    return () => unsubscribe();
  }, [driverId]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
      >
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver Location"
            description="Your driver's current location"
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
  },
});

export default DriverLocationMap; 