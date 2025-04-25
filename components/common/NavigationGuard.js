import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

export function NavigationGuard({ children, requiredRole = null }) {
  const { user } = useAuth();
  const { showError } = useError();
  const navigation = useNavigation();

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
      showError('Please sign in to continue');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      navigation.replace('Auth');
      showError(`Access denied. ${requiredRole} access only`);
      return;
    }
  }, [user, requiredRole, navigation, showError]);

  return children;
}
