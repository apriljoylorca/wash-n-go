import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../config/firebase';
import { ref, onValue, get } from 'firebase/database';
import { createOrder } from '../../services/orderService';
import { handleFirebaseError } from '../../services/errorService';
import { Colors } from '../../constants/colors';

import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import GradientBackground from '../../components/common/GradientBackground';
import DecorativeBubbles from '../../components/common/DecorativeBubbles';
import SchedulePicker from '../../components/common/SchedulePicker';

const OrderBookingScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weight, setWeight] = useState('5kg');
  const [extras, setExtras] = useState([]);
  const [schedule, setSchedule] = useState({ 
    date: new Date(),
    frequency: 'once',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    barangay: '',
    city: '',
    province: '',
    latitude: 0,
    longitude: 0
  });
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    barangay: '',
    city: '',
    province: '',
    latitude: 0,
    longitude: 0
  });
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (!database) {
      console.error('Database not initialized');
      setError('Database not initialized');
      setLoading(false);
      return;
    }

    // Fetch services from Firebase
    const servicesRef = ref(database, 'services');
    const unsubscribe = onValue(servicesRef, 
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const servicesArray = Object.entries(data).map(([id, service]) => ({
              id,
              ...service
            }));
            setServices(servicesArray);
          }
          setError(null);
        } catch (error) {
          console.error('Error processing services data:', error);
          setError('Failed to process services data');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching services:', error);
        setError('Failed to load services. Please try again later.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (route.params?.serviceId && services.length > 0) {
      const service = services.find(s => s.id === route.params.serviceId);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [route.params?.serviceId, services]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const serviceRef = ref(database, `services/${route.params.serviceId}`);
        const snapshot = await get(serviceRef);

        if (!snapshot.exists()) {
          setError('Service not found');
          setLoading(false);
          return;
        }

        setSelectedService(snapshot.val());
        setLoading(false);
      } catch (error) {
        handleFirebaseError(error);
        setError('Failed to fetch service details');
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [route.params.serviceId]);

  const calculateTotal = () => {
    if (!selectedService || !selectedService.priceByWeight) return 0;
    
    let total = selectedService.priceByWeight[weight] || 0;
    
    extras.forEach(extraId => {
      const extra = services.find(s => s.id === extraId);
      if (extra && extra.pricePerPiece) total += extra.pricePerPiece;
    });

    return total;
  };

  const validateOrder = (orderData) => {
    // Validate service and weight
    if (!orderData.items || !orderData.items.length) {
      throw new Error('Please select a service');
    }

    const service = orderData.items[0];
    if (!service.serviceId || !service.serviceName) {
      throw new Error('Invalid service selection');
    }

    if (!service.weight || service.weight <= 0) {
      throw new Error('Please select a valid weight');
    }

    // Validate addresses
    if (!orderData.pickupAddress || !orderData.deliveryAddress) {
      throw new Error('Both pickup and delivery addresses are required');
    }

    const requiredAddressFields = ['street', 'barangay', 'city', 'province'];
    for (const field of requiredAddressFields) {
      if (!orderData.pickupAddress[field] || !orderData.deliveryAddress[field]) {
        throw new Error(`Missing required address field: ${field}`);
      }
    }

    // Validate schedule
    if (!orderData.pickupSchedule) {
      throw new Error('Please select a pickup schedule');
    }

    const pickupDate = new Date(orderData.pickupSchedule);
    const now = new Date();

    // Compare dates without time
    const pickupDateOnly = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (pickupDateOnly < nowDateOnly) {
      throw new Error('Please select a future date');
    }

    // If it's today, check the time
    if (pickupDateOnly.getTime() === nowDateOnly.getTime() && pickupDate <= now) {
      throw new Error('Please select a future time');
    }

    // Validate payment method
    if (!['cod', 'cop'].includes(orderData.paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    // Validate amounts
    if (orderData.subtotal <= 0 || orderData.total <= 0) {
      throw new Error('Invalid order amounts');
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    try {
      if (!selectedService) {
        Alert.alert('Error', 'Service details not available');
        return;
      }

      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      setLoading(true);
      setError(null);

      // Log the order data before validation
      console.log('Order data before validation:', {
        user: user ? { uid: user.uid, role: user.role } : 'No user',
        selectedService: selectedService ? { id: selectedService.id, name: selectedService.name } : 'No service',
        weight,
        pickupAddress,
        deliveryAddress,
        schedule,
        paymentMethod,
        total: calculateTotal()
      });

      const orderData = {
        customerId: user.uid,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        items: [
          {
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            weight: parseFloat(weight.replace('kg', '')),
            price: selectedService.priceByWeight[weight]
          }
        ],
        pickupAddress: {
          street: pickupAddress.street,
          barangay: pickupAddress.barangay,
          city: pickupAddress.city,
          province: pickupAddress.province,
          latitude: pickupAddress.latitude || 0,
          longitude: pickupAddress.longitude || 0
        },
        deliveryAddress: {
          street: deliveryAddress.street,
          barangay: deliveryAddress.barangay,
          city: deliveryAddress.city,
          province: deliveryAddress.province,
          latitude: deliveryAddress.latitude || 0,
          longitude: deliveryAddress.longitude || 0
        },
        pickupSchedule: schedule.date.getTime(),
        deliverySchedule: new Date(schedule.date.getTime() + 24 * 60 * 60 * 1000).getTime(),
        subtotal: calculateTotal(),
        deliveryFee: 0,
        total: calculateTotal(),
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Log the final order data
      console.log('Final order data:', orderData);

      // Validate the order data
      validateOrder(orderData);

      const orderId = await createOrder(orderData, user);
      console.log('Order created successfully with ID:', orderId);
      Alert.alert('Success', 'Order placed successfully');
      navigation.navigate('CustomerTrackOrder', { orderId });
    } catch (error) {
      console.error('Error in handlePlaceOrder:', error);
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
      Alert.alert('Error', handledError.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <LoadingIndicator message="Loading services..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  const renderServiceOption = (service) => (
    <TouchableOpacity
      key={service.id}
      style={[
        styles.serviceOption,
        selectedService?.id === service.id && styles.selectedServiceOption,
      ]}
      onPress={() => {
        setSelectedService(service);
        setWeight('5kg');
      }}
    >
      <View style={styles.serviceInfo}>
        <MaterialIcons 
          name={service.icon || 'local-laundry-service'} 
          size={24} 
          color={selectedService?.id === service.id ? '#FFFFFF' : '#0066CC'} 
        />
        <View style={styles.serviceTextContainer}>
          <Text style={[
            styles.serviceName,
            selectedService?.id === service.id && styles.selectedServiceName
          ]}>
            {service.name}
          </Text>
          <Text style={[
            styles.serviceDescription,
            selectedService?.id === service.id && styles.selectedServiceDescription
          ]}>
            {service.description}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.servicePrice,
        selectedService?.id === service.id && styles.selectedServicePrice
      ]}>
        From ₱{service.priceByWeight ? service.priceByWeight['5kg'] : 0}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Book Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!selectedService ? (
          <View style={styles.serviceSelection}>
            <Text style={styles.sectionTitle}>Select a Service</Text>
            {services.filter(s => !s.isExtra).map(renderServiceOption)}
          </View>
        ) : (
          <>
            <View style={styles.selectedServiceContainer}>
              <View style={styles.selectedServiceHeader}>
                <Text style={styles.sectionTitle}>Selected Service</Text>
                <TouchableOpacity 
                  style={styles.changeButton}
                  onPress={() => {
                    setSelectedService(null);
                    setWeight('5kg');
                  }}
                >
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
              {renderServiceOption(selectedService)}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight (kg)</Text>
              <View style={styles.weightOptions}>
                {selectedService.priceByWeight && Object.entries(selectedService.priceByWeight).map(([kg, price]) => (
                  <TouchableOpacity
                    key={kg}
                    style={[
                      styles.weightOption,
                      weight === kg && styles.selectedWeightOption
                    ]}
                    onPress={() => setWeight(kg)}
                  >
                    <Text style={[
                      styles.weightText,
                      weight === kg && styles.selectedWeightText
                    ]}>
                      {kg}
                    </Text>
                    <Text style={[
                      styles.weightPrice,
                      weight === kg && styles.selectedWeightPrice
                    ]}>
                      ₱{price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <SchedulePicker
                value={schedule}
                onChange={setSchedule}
                minimumDate={new Date()}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup Address</Text>
              <InputField
                value={pickupAddress.street}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, street: text })}
                placeholder="Street"
              />
              <InputField
                value={pickupAddress.barangay}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, barangay: text })}
                placeholder="Barangay"
              />
              <InputField
                value={pickupAddress.city}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, city: text })}
                placeholder="City"
              />
              <InputField
                value={pickupAddress.province}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, province: text })}
                placeholder="Province"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <InputField
                value={deliveryAddress.street}
                onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, street: text })}
                placeholder="Street"
              />
              <InputField
                value={deliveryAddress.barangay}
                onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, barangay: text })}
                placeholder="Barangay"
              />
              <InputField
                value={deliveryAddress.city}
                onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, city: text })}
                placeholder="City"
              />
              <InputField
                value={deliveryAddress.province}
                onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, province: text })}
                placeholder="Province"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <InputField
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions?"
                multiline
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'cod' && styles.selectedPaymentOption
                  ]}
                  onPress={() => setPaymentMethod('cod')}
                >
                  <View style={styles.paymentInfo}>
                    <MaterialIcons 
                      name="local-shipping" 
                      size={24} 
                      color={paymentMethod === 'cod' ? '#FFFFFF' : '#0066CC'} 
                    />
                    <Text style={[
                      styles.paymentText,
                      paymentMethod === 'cod' && styles.selectedPaymentText
                    ]}>
                      Cash on Delivery
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'cop' && styles.selectedPaymentOption
                  ]}
                  onPress={() => setPaymentMethod('cop')}
                >
                  <View style={styles.paymentInfo}>
                    <MaterialIcons 
                      name="store" 
                      size={24} 
                      color={paymentMethod === 'cop' ? '#FFFFFF' : '#0066CC'} 
                    />
                    <Text style={[
                      styles.paymentText,
                      paymentMethod === 'cop' && styles.selectedPaymentText
                    ]}>
                      Cash on Pickup
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{selectedService.name} ({weight})</Text>
              </View>
              {extras.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Extras:</Text>
                  <View style={styles.summaryExtras}>
                    {extras.map(extraId => {
                      const extra = services.find(s => s.id === extraId);
                      return (
                        <Text key={extraId} style={styles.summaryValue}>
                          {extra.name}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule:</Text>
                <Text style={styles.summaryValue}>
                  {schedule.date.toLocaleDateString()} ({schedule.frequency})
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>₱{calculateTotal()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  serviceSelection: {
    marginBottom: 20,
  },
  serviceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  selectedServiceOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  selectedServiceName: {
    color: '#FFFFFF',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666666',
  },
  selectedServiceDescription: {
    color: '#FFFFFF',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  selectedServicePrice: {
    color: '#FFFFFF',
  },
  weightOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weightOption: {
    width: '31%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  selectedWeightOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  weightText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedWeightText: {
    color: '#FFFFFF',
  },
  weightPrice: {
    fontSize: 14,
    color: '#666666',
  },
  selectedWeightPrice: {
    color: '#FFFFFF',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0066CC',
    backgroundColor: '#FFFFFF',
  },
  selectedPaymentOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    textAlign: 'center',
  },
  selectedPaymentText: {
    color: '#FFFFFF',
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  summaryExtras: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectedServiceContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
  },
});

export default OrderBookingScreen;