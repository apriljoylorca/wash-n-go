import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import GradientBackground from '../../components/common/GradientBackground';
import { MaterialIcons } from '@expo/vector-icons';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { Colors } from '../../constants/colors';
import { subscribeToDriverProfile, updateDriverProfile, registerDriver } from '../../services/driverService';
import { handleFirebaseError } from '../../utils/errorHandler';

const DriverProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    vehicleType: '',
    plateNumber: '',
    licenseNumber: '',
    vehicleModel: '',
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    let unsubscribeDriver;

    const setupData = async () => {
      try {
        unsubscribeDriver = subscribeToDriverProfile(user.uid, async (profile, error) => {
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
                licenseNumber: '',
                vehicleModel: '',
              });
              setDriverData(newProfile);
              setEditedData({
                vehicleType: newProfile.vehicleType || '',
                plateNumber: newProfile.plateNumber || '',
                licenseNumber: newProfile.licenseNumber || '',
                vehicleModel: newProfile.vehicleModel || '',
              });
            } catch (error) {
              const handledError = handleFirebaseError(error);
              setError(handledError.message);
            }
          } else {
            setDriverData(profile);
            setEditedData({
              vehicleType: profile.vehicleType || '',
              plateNumber: profile.plateNumber || '',
              licenseNumber: profile.licenseNumber || '',
              vehicleModel: profile.vehicleModel || '',
            });
          }
          setLoading(false);
        });
      } catch (error) {
        const handledError = handleFirebaseError(error);
        setError(handledError.message);
        setLoading(false);
      }
    };

    setupData();

    return () => {
      if (unsubscribeDriver) unsubscribeDriver();
    };
  }, [user]);

  const handleStatusPress = async () => {
    try {
      const newStatus = driverData.status === 'active' ? 'inactive' : 'active';
      await updateDriverProfile(user.uid, { status: newStatus });
    } catch (error) {
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleSavePress = async () => {
    try {
      // Validate required fields
      if (!editedData.vehicleType || !editedData.plateNumber || !editedData.licenseNumber) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await updateDriverProfile(user.uid, editedData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    }
  };

  const handleCancelPress = () => {
    setEditedData({
      vehicleType: driverData.vehicleType || '',
      plateNumber: driverData.plateNumber || '',
      licenseNumber: driverData.licenseNumber || '',
      vehicleModel: driverData.vehicleModel || '',
    });
    setIsEditing(false);
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
            onPress={() => {
              setLoading(true);
              setError(null);
              setDriverData(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Driver Profile</Text>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.rating}>Rating: {driverData?.rating || '4.5'} ★</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{driverData?.totalDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{driverData?.activeOrders || 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{driverData?.onTimePercentage || '98%'}</Text>
            <Text style={styles.statLabel}>On Time</Text>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="email" size={20} color={Colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="phone" size={20} color={Colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={handleEditPress}>
                <MaterialIcons name="edit" size={24} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity onPress={handleSavePress} style={styles.saveButton}>
                  <MaterialIcons name="check" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelPress} style={styles.cancelButton}>
                  <MaterialIcons name="close" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="two-wheeler" size={20} color={Colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Vehicle Type *</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.vehicleType}
                  onChangeText={(text) => setEditedData({ ...editedData, vehicleType: text })}
                  placeholder="Enter vehicle type"
                />
              ) : (
                <Text style={styles.infoValue}>{driverData?.vehicleType || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="badge" size={20} color={Colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Plate Number *</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.plateNumber}
                  onChangeText={(text) => setEditedData({ ...editedData, plateNumber: text })}
                  placeholder="Enter plate number"
                />
              ) : (
                <Text style={styles.infoValue}>{driverData?.plateNumber || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="card-membership" size={20} color={Colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>License Number *</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.licenseNumber}
                  onChangeText={(text) => setEditedData({ ...editedData, licenseNumber: text })}
                  placeholder="Enter license number"
                />
              ) : (
                <Text style={styles.infoValue}>{driverData?.licenseNumber || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="directions-car" size={20} color={Colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Vehicle Model</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.vehicleModel}
                  onChangeText={(text) => setEditedData({ ...editedData, vehicleModel: text })}
                  placeholder="Enter vehicle model"
                />
              ) : (
                <Text style={styles.infoValue}>{driverData?.vehicleModel || 'Not set'}</Text>
              )}
            </View>
          </View>
        </View>
        
        <Button
          title={driverData?.status === 'active' ? 'Go Offline' : 'Go Online'}
          onPress={handleStatusPress}
          style={[
            styles.statusButton,
            { backgroundColor: driverData?.status === 'active' ? Colors.error : Colors.primary }
          ]}
        />
        
        <Button
          title="Log Out"
          onPress={logout}
          style={styles.logoutButton}
        />
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
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  rating: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButtons: {
    flexDirection: 'row',
  },
  saveButton: {
    marginRight: 10,
  },
  cancelButton: {
    marginLeft: 10,
  },
  infoContainer: {
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: Colors.text,
  },
  statusButton: {
    marginTop: 20,
  },
  logoutButton: {
    marginTop: 15,
    backgroundColor: Colors.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.primary,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverProfileScreen;