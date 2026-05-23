// Sense Health — Navigation
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';
import { Typography, Spacing } from '../theme/typography';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GamesScreen from '../screens/GamesScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import AISuggestionsScreen from '../screens/AISuggestionsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'HomeTab': iconName = focused ? 'home' : 'home-outline'; break;
            case 'LogTab': iconName = focused ? 'add-circle' : 'add-circle-outline'; break;
            case 'AnalyticsTab': iconName = focused ? 'trending-up' : 'trending-up-outline'; break;
            case 'GamesTab': iconName = focused ? 'game-controller' : 'game-controller-outline'; break;
            case 'ProfileTab': iconName = focused ? 'person' : 'person-outline'; break;
            default: iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
          elevation: 10,
          shadowColor: Colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontWeight: '600',
          fontSize: 11,
          marginTop: -4,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="LogTab" component={LogScreen} options={{ tabBarLabel: 'Log' }} />
      <Tab.Screen name="GamesTab" component={GamesScreen} options={{ tabBarLabel: 'Games' }} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsScreen} options={{ tabBarLabel: 'Trends' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, hasSetupPermissions } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        hasSetupPermissions ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AISuggestions" component={AISuggestionsScreen} />
          </>
        ) : (
          <Stack.Screen name="Permissions" component={PermissionsScreen} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ animationTypeForReplace: 'pop' }} />
      )}
    </Stack.Navigator>
  );
}
