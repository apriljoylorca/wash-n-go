import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const ServiceList = ({ onServiceSelect, selectedServices = [] }) => {
  const { theme } = useDarkMode();

  const renderServiceItem = ({ item }) => {
    const isSelected = selectedServices.includes(item.id);
    const isExtra = item.isExtra;

    return (
      <TouchableOpacity
        style={[
          styles.serviceItem,
          { 
            backgroundColor: theme.surfaceColor,
            borderColor: isSelected ? theme.primaryColor : theme.surfaceColor
          }
        ]}
        onPress={() => onServiceSelect(item.id)}
      >
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, { color: theme.textColor }]}>
            {item.name}
          </Text>
          <Text style={[styles.serviceDesc, { color: theme.textColor }]}>
            {item.description}
          </Text>
        </View>
        
        {isExtra ? (
          <Text style={[styles.servicePrice, { color: theme.primaryColor }]}>
            +₱{item.price}
          </Text>
        ) : (
          <View style={styles.weightPrices}>
            {Object.entries(item.prices).map(([weight, price]) => (
              <View key={weight} style={styles.priceTag}>
                <Text style={[styles.weight, { color: theme.textColor }]}>{weight}</Text>
                <Text style={[styles.price, { color: theme.primaryColor }]}>₱{price}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={services}
      renderItem={renderServiceItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  serviceItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  serviceDesc: {
    fontSize: 14,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  weightPrices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  priceTag: {
    marginLeft: 10,
    alignItems: 'center',
  },
  weight: {
    fontSize: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ServiceList;