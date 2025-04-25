import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, database } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { useError } from './ErrorContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { showError } = useError();

  useEffect(() => {
    let dbUnsubscribe = null;
    let authUnsubscribe = null;
    let mounted = true;

    const initializeAuth = async () => {
      if (!auth || !database) {
        console.error('Firebase services not initialized');
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!mounted) return;

          if (firebaseUser) {
            const userRef = ref(database, `users/${firebaseUser.uid}`);
            
            if (dbUnsubscribe) {
              dbUnsubscribe();
            }

            dbUnsubscribe = onValue(userRef, 
              (snapshot) => {
                if (!mounted) return;

                try {
                  const userData = snapshot.val();
                  if (userData) {
                    setUser({
                      ...firebaseUser,
                      ...userData
                    });
                  } else {
                    setUser(firebaseUser);
                  }
                } catch (error) {
                  console.error('Error processing user data:', error);
                  setUser(firebaseUser);
                } finally {
                  setLoading(false);
                  setInitialized(true);
                }
              },
              (error) => {
                if (!mounted) return;
                console.error('Database read error:', error);
                setUser(firebaseUser);
                setLoading(false);
                setInitialized(true);
              }
            );
          } else {
            if (dbUnsubscribe) {
              dbUnsubscribe();
              dbUnsubscribe = null;
            }
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authUnsubscribe) {
        authUnsubscribe();
      }
      if (dbUnsubscribe) {
        dbUnsubscribe();
      }
    };
  }, [showError]);

  const logout = async () => {
    if (!auth) {
      console.error('Auth service not initialized');
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      showError('Error signing out');
    }
  };

  const value = {
    user,
    loading,
    initialized,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}