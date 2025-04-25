import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import { OrderProvider } from './context/OrderContext';
import RootNavigator from './navigation/RootNavigator';
import { LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';

// Enable native screens for better performance
enableScreens();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorProvider>
        <AuthProvider>
          <OrderProvider>
            <RootNavigator />
          </OrderProvider>
        </AuthProvider>
      </ErrorProvider>
    </SafeAreaProvider>
  );
}
