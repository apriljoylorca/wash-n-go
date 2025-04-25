import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getOrderById, submitCustomerRating } from '../../services/orderService';
import { handleFirebaseError } from '../../utils/errorHandler';

import TrackingStepper from '../../components/customer/TrackingStepper';
import OrderCard from '../../components/customer/OrderCard';
import RatingModal from '../../components/common/RatingModal';
import DriverLocationMap from '../../components/customer/DriverLocationMap';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const TrackOrderScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!user || !orderId) return;

    try {
      setLoading(true);
      setError(null);
      const orderData = await getOrderById(orderId, user);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [user, orderId]);

  useEffect(() => {
    if (!authLoading && isInitialLoad) {
      loadOrder();
    }
  }, [authLoading, isInitialLoad, loadOrder]);

  const statusSteps = [
    { title: 'Order Placed', key: 'pending' },
    { title: 'Picked Up', key: 'picked_up' },
    { title: 'Washing', key: 'washing' },
    { title: 'Out for Delivery', key: 'out_for_delivery' },
    { title: 'Delivered', key: 'delivered' },
  ];

  const handleRatingSubmit = async (rating, comment) => {
    try {
      if (!user) {
        throw new Error('Please sign in to submit a rating');
      }

      await submitCustomerRating(orderId, rating, comment, user);
      setShowRatingModal(false);
      // Refresh order data to show updated rating
      await loadOrder();
    } catch (error) {
      console.error('Error submitting rating:', error);
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    }
  };

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingIndicator message="Loading order details..." />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Please sign in to view order details</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <OrderCard order={order} showStatus={false} />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <TrackingStepper 
            steps={statusSteps} 
            currentStatus={order.status} 
          />
        </View>
        
        {order.driverName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Driver</Text>
            <View style={styles.driverCard}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{order.driverName}</Text>
                <TouchableOpacity style={styles.contactButton}>
                  <MaterialIcons name="phone" size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>Contact Driver</Text>
                </TouchableOpacity>
              </View>
              {order.driverId && (
                <View style={styles.mapContainer}>
                  <DriverLocationMap 
                    orderId={orderId} 
                    driverId={order.driverId} 
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {order.status === 'delivered' && !order.customerRating && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => setShowRatingModal(true)}
          >
            <MaterialIcons name="star" size={24} color={Colors.white} />
            <Text style={styles.rateButtonText}>Rate Your Experience</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        title="Rate Your Experience"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  driverCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  rateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TrackOrderScreen;