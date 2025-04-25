import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import CustomerStack from './CustomerStack';
import DriverTabs from './DriverStack';
import { useAuth } from '../context/AuthContext';
import LoadingIndicator from '../components/common/LoadingIndicator';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : user.role === 'customer' ? (
          <Stack.Screen name="CustomerTabs" component={CustomerStack} />
        ) : user.role === 'driver' ? (
          <Stack.Screen name="DriverTabs" component={DriverTabs} />
        ) : (
          // Fallback to auth if role is invalid
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;