import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Alert, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { Colors } from '../../constants/colors';
import DriverOrderCard from '../../components/driver/DriverOrderCard';
import DriverStatusCard from '../../components/driver/DriverStatusCard';
import DriverEarningsCard from '../../components/driver/DriverEarningsCard';
import { database } from '../../config/firebase';
import { ref, query, orderByChild, equalTo, onValue, get, off, set, update, push } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { getDriverProfile, registerDriver, subscribeToDriverProfile, updateDriverProfile } from '../../services/driverService';
import { handleFirebaseError } from '../../utils/errorHandler';
import { assignDriverToOrder, updateOrderStatus } from '../../services/orderService';
import * as Location from 'expo-location';
import { updateDriverLocation } from '../../services/driverService';

const DriverHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const setupData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    try {
      // First check if user has driver role
      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const userData = userSnapshot.val();
      if (userData.role !== 'driver') {
        setError('Please register as a driver first');
        setLoading(false);
        return;
      }

      // Set up real-time driver profile subscription
      const unsubscribeDriver = subscribeToDriverProfile(user.uid, async (profile, error) => {
        if (error) {
          const handledError = handleFirebaseError(error);
          setError(handledError.message);
          setLoading(false);
          return;
        }

        if (!profile) {
          try {
            // Create new driver profile if it doesn't exist
            const newProfile = await registerDriver(user.uid, {
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              phoneNumber: user.phoneNumber || '',
              vehicleType: 'Motorcycle',
              plateNumber: '',
              isOnline: false,
              driverStatus: 'inactive'
            });
            setDriverData(newProfile);
            setIsOnline(newProfile.isOnline || false);
          } catch (error) {
            const handledError = handleFirebaseError(error);
            setError(handledError.message);
            setLoading(false);
          }
        } else {
          setDriverData(profile);
          setIsOnline(profile.isOnline || false);
        }
      });

      setLoading(false);
      return unsubscribeDriver;
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
      setLoading(false);
      return null;
    }
  }, [user]);

  const setupOrdersListeners = useCallback(() => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return null;
    }

    try {
      // Query for orders assigned to this driver
      const assignedOrdersRef = query(
        ref(database, 'orders'),
        orderByChild('driverId'),
        equalTo(user.uid)
      );

      // Query for available orders (pending or approved without driver)
      const availableOrdersRef = query(
        ref(database, 'orders'),
        orderByChild('status')
      );

      // Listen for real-time updates on assigned orders
      const assignedUnsubscribe = onValue(assignedOrdersRef, (snapshot) => {
        const ordersData = [];
        snapshot.forEach((childSnapshot) => {
          const order = childSnapshot.val();
          // Only include active orders (not delivered or cancelled)
          if (order.status !== 'delivered' && order.status !== 'cancelled') {
            ordersData.push({
              id: childSnapshot.key,
              ...order,
            });
          }
        });
        setAssignedOrders(ordersData);
      }, (error) => {
        const handledError = handleFirebaseError(error);
        setError(handledError.message);
      });

      // Listen for real-time updates on available orders
      const availableUnsubscribe = onValue(availableOrdersRef, (snapshot) => {
        const ordersData = [];
        snapshot.forEach((childSnapshot) => {
          const order = childSnapshot.val();
          // Only include pending or approved orders without a driver
          if ((order.status === 'pending' || order.status === 'approved') && !order.driverId) {
            ordersData.push({
              id: childSnapshot.key,
              ...order,
            });
          }
        });
        setAvailableOrders(ordersData);
      }, (error) => {
        const handledError = handleFirebaseError(error);
        setError(handledError.message);
      });

      setLoading(false);
      setRefreshing(false);
      setError(null);

      return () => {
        assignedUnsubscribe();
        availableUnsubscribe();
      };
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
      setLoading(false);
      setRefreshing(false);
      return null;
    }
  }, [user]);

  const setupLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Update driver location in database
      if (user?.uid) {
        await updateDriverLocation(user.uid, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now(),
        });
      }

      // Set up location updates
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (user?.uid && isOnline) {
            await updateDriverLocation(user.uid, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
            });
          }
        }
      );

      return locationSubscription;
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setLocationError(handledError.message);
      return null;
    }
  }, [user, isOnline]);

  useEffect(() => {
    let unsubscribeDriver;
    let locationSubscription;
    
    const init = async () => {
      unsubscribeDriver = await setupData();
      setupOrdersListeners();
      if (isOnline) {
        locationSubscription = await setupLocationTracking();
      }
    };

    init();

    return () => {
      if (unsubscribeDriver) {
        unsubscribeDriver();
      }
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [setupData, setupOrdersListeners, setupLocationTracking, isOnline]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setupOrdersListeners();
  }, [setupOrdersListeners]);

  const handleStatusPress = async () => {
    try {
      setLoading(true);
      const newStatus = driverData.driverStatus === 'active' ? 'inactive' : 'active';
      const newOnlineStatus = !isOnline;
      
      if (newOnlineStatus) {
        // When going online, ensure we have location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Location permission is required to go online');
          return;
        }
      }
      
      await updateDriverProfile(user.uid, { 
        driverStatus: newStatus,
        isOnline: newOnlineStatus
      });
      
      setIsOnline(newOnlineStatus);
    } catch (error) {
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatsPress = (type) => {
    if (type === 'deliveries') {
      navigation.navigate('DriverOrders');
    } else if (type === 'rating') {
      // Show rating details
    }
  };

  const handleEarningsPress = () => {
    navigation.navigate('DriverEarnings');
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      if (!isOnline) {
        Alert.alert('Error', 'Please go online to accept orders');
        return;
      }

      setLoading(true);
      await assignDriverToOrder(orderId, user.uid, user);
      Alert.alert('Success', 'Order accepted successfully');
    } catch (error) {
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (!isOnline) {
        Alert.alert('Error', 'Please go online to update order status');
        return;
      }

      setLoading(true);
      await updateOrderStatus(orderId, newStatus, user);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPress = (orderId) => {
    navigation.navigate('DriverOrders', {
      screen: 'DriverLocation',
      params: { orderId }
    });
  };

  const renderOrderCard = (order) => {
    const isAssigned = order.driverId === user?.uid;
    const canAccept = !isAssigned && isOnline;
    const canUpdateStatus = isAssigned && isOnline;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order.id.substring(0, 8)}</Text>
          <Text style={styles.orderStatus}>{order.status}</Text>
        </View>
        
        <View style={styles.orderDetails}>
          <Text style={styles.orderText}>Customer: {order.customerName}</Text>
          <Text style={styles.orderText}>Address: {order.deliveryAddress}</Text>
          <Text style={styles.orderText}>Amount: ₱{order.totalAmount}</Text>
        </View>

        {canAccept && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(order.id)}
          >
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          </TouchableOpacity>
        )}

        {canUpdateStatus && (
          <View style={styles.statusButtons}>
            {order.status === 'assigned' && (
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => handleUpdateStatus(order.id, 'picked_up')}
              >
                <Text style={styles.statusButtonText}>Mark as Picked Up</Text>
              </TouchableOpacity>
            )}
            {order.status === 'picked_up' && (
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => handleUpdateStatus(order.id, 'delivered')}
              >
                <Text style={styles.statusButtonText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconButton}
        >
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <DriverStatusCard 
            status={driverData?.driverStatus || 'inactive'}
            totalDeliveries={driverData?.totalDeliveries || 0}
            rating={driverData?.rating || '4.5'}
            onStatusPress={handleStatusPress}
            onStatsPress={handleStatsPress}
          />

          <DriverEarningsCard 
            todayEarnings={0} // Calculate from orders
            weeklyEarnings={0} // Calculate from orders
            monthlyEarnings={0} // Calculate from orders
            onViewDetails={handleEarningsPress}
          />

          <View style={styles.ordersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Orders</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{availableOrders.length}</Text>
              </View>
            </View>

            {availableOrders.length > 0 ? (
              <FlatList
                data={availableOrders}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <DriverOrderCard 
                    order={item} 
                    onAccept={() => handleAcceptOrder(item.id)}
                    onPress={() => handleOrderPress(item.id)}
                    showAccept={true}
                  />
                )}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment" size={48} color={Colors.textPrimary} />
                <Text style={styles.emptyText}>No available orders</Text>
              </View>
            )}
          </View>

          <View style={styles.ordersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Active Orders</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{assignedOrders.length}</Text>
              </View>
            </View>

            {assignedOrders.length > 0 ? (
              <FlatList
                data={assignedOrders}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <DriverOrderCard 
                    order={item} 
                    onUpdateStatus={(status) => handleUpdateStatus(item.id, status)}
                    onPress={() => handleOrderPress(item.id)}
                    showStatusUpdate={true}
                  />
                )}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="local-shipping" size={48} color={Colors.textPrimary} />
                <Text style={styles.emptyText}>No active orders</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textPrimary,
    opacity: 0.8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ordersSection: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    borderRadius: 10,
    marginTop: 10,
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
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
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  orderStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderDetails: {
    marginBottom: 10,
  },
  orderText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DriverHomeScreen;