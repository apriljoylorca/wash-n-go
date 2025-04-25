import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ServiceCard from '../../components/common/ServiceCard';
import { getActiveServices } from '../../services/serviceService';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { handleFirebaseError } from '../../utils/errorHandler';

const ServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const activeServices = await getActiveServices();
        setServices(activeServices);
        setError(null);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError(handleFirebaseError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
        <LoadingIndicator message="Loading services..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#ff0000" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f0f8ff' }]}>
      <View style={[styles.header, { backgroundColor: '#f0f8ff' }]}>
        <Text style={[styles.title, { color: '#00bfff' }]}>Our Services</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconButton}
        >
          <MaterialIcons name="notifications" size={24} color="#00bfff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.subtitleContainer}>
        <MaterialIcons name="local-laundry-service" size={24} color="#00bfff" />
        <Text style={[styles.subtitle, { color: '#4169e1' }]}>
          Choose from our professional services
        </Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ backgroundColor: '#f0f8ff' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {services.map((service) => (
            <ServiceCard 
              key={service.id}
              service={service}
              onPress={() => navigation.navigate('CustomerOrderBooking', { 
                serviceId: service.id,
                serviceName: service.name 
              })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginLeft: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ServicesScreen;