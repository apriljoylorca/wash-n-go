// components/customer/ServiceCard.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ServiceCard = ({ service, onPress }) => {
  const getServiceIcon = (serviceName) => {
    switch (serviceName.toLowerCase()) {
      case 'laundry':
        return 'local-laundry-service';
      case 'dry cleaning':
        return 'dry-cleaning';
      case 'ironing':
        return 'iron';
      case 'folding':
        return 'content-copy';
      default:
        return 'local-laundry-service';
    }
  };

  // Get the lowest price from priceByWeight
  const getLowestPrice = (priceByWeight) => {
    if (!priceByWeight) return 0;
    const prices = Object.values(priceByWeight);
    return Math.min(...prices);
  };

  // Format the price display
  const formatPriceDisplay = (service) => {
    if (service.pricePerPiece) {
      return `₱${service.pricePerPiece}/piece`;
    }
    const lowestPrice = getLowestPrice(service.priceByWeight);
    return `₱${lowestPrice}/5kg`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: service.imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={getServiceIcon(service.name)} 
            size={32} 
            color="#00bfff" 
          />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#00bfff' }]}>{service.name}</Text>
        <Text style={[styles.description, { color: '#87cefa' }]}>{service.description}</Text>
        <View style={styles.footer}>
          <View>
            <Text style={[styles.startingFrom, { color: '#4169e1' }]}>Starting from</Text>
            <Text style={[styles.price, { color: '#4169e1' }]}>{formatPriceDisplay(service)}</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#00bfff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startingFrom: {
    fontSize: 10,
    opacity: 0.8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServiceCard;