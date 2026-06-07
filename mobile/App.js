// Sense Health — Main App Entry
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Colors from './src/theme/colors';
import { initUsageTracker } from './src/services/UsageTracker';

export default function App() {
  useEffect(() => {
    const removeTracker = initUsageTracker();
    return () => {
      if (removeTracker) removeTracker();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
