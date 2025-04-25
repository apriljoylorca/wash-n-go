import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { database } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';

const LocationTracker = ({ orderId }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [shopLocation, setShopLocation] = useState({
    latitude: 10.3795, // Toledo City coordinates
    longitude: 123.6384,
  });

  useEffect(() => {
    const driverRef = ref(database, `drivers/${orderId}/location`);
    
    const listener = onValue(driverRef, (snapshot) => {
      const location = snapshot.val();
      if (location) {
        setDriverLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        setRouteCoordinates(prev => [...prev, {
          latitude: location.latitude,
          longitude: location.longitude,
        }]);
      }
    });

    return () => off(driverRef, 'value', listener);
  }, [orderId]);

  if (!driverLocation) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={driverLocation}
          title="Driver"
          description="Your laundry is here"
          pinColor={Colors.primary}
        />
        
        <Marker
          coordinate={shopLocation}
          title="Laundry Shop"
          description="The Laundry Collective"
          pinColor={Colors.secondary}
        />
        
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default LocationTracker;