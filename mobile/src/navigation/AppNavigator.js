// Sense Health — Navigation
import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

// Custom Reanimated transitions
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import LogScreen from '../screens/LogScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AISuggestionsScreen from '../screens/AISuggestionsScreen';
import ReactionGameScreen from '../screens/ReactionGameScreen';
import MemoryGameScreen from '../screens/MemoryGameScreen';
import ColorGameScreen from '../screens/ColorGameScreen';
import BreathingScreen from '../screens/BreathingScreen';
import JournalScreen from '../screens/JournalScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import AuthScreen from '../screens/AuthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Custom floating tab bar background
function TabBarBackground() {
  return (
    <View style={styles.tabBarBackgroundContainer}>
      <LinearGradient
        colors={[Colors.surface, '#F8FAF9']}
        style={styles.tabBarBackground}
      />
    </View>
  );
}

// Custom log button with concentric pulsing animation
function CustomLogButton({ children, onPress }) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.35, { duration: 1800 }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1800 }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <TouchableOpacity
      style={styles.logButtonContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Pulsing Concentric Outer Ring */}
      <ReAnimated.View
        style={[
          {
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: Colors.primary,
            zIndex: -1,
          },
          pulseStyle,
        ]}
      />
      <LinearGradient
        colors={Colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logButtonInner}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Custom tab icon that wiggles and scales up on focus
function TabIcon({ name, focused, color }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.25 : 1, { damping: 10, stiffness: 150 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconContainer}>
      <ReAnimated.View style={animStyle}>
        <Ionicons name={name} size={24} color={color} />
      </ReAnimated.View>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'LogTab') return null; // Handled by custom button

          let iconName;
          switch (route.name) {
            case 'HomeTab': iconName = focused ? 'home' : 'home-outline'; break;
            case 'AnalyticsTab': iconName = focused ? 'trending-up' : 'trending-up-outline'; break;
            case 'GamesTab': iconName = focused ? 'game-controller' : 'game-controller-outline'; break;
            case 'ProfileTab': iconName = focused ? 'person' : 'person-outline'; break;
            default: iconName = 'ellipse';
          }

          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <TabBarBackground />,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsScreen} />
      
      <Tab.Screen 
        name="LogTab" 
        component={LogScreen} 
        options={{
          tabBarStyle: { display: 'none' },
          tabBarButton: (props) => <CustomLogButton {...props} />,
        }} 
      />
      
      <Tab.Screen name="GamesTab" component={GamesScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, hasSetupPermissions } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        hasSetupPermissions ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AISuggestions" component={AISuggestionsScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ReactionGame" component={ReactionGameScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="MemoryGame" component={MemoryGameScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ColorGame" component={ColorGameScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Breathing" component={BreathingScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Journal" component={JournalScreen} options={{ animation: 'slide_from_bottom' }} />
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    height: 70,
    borderRadius: Radius.full,
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  tabBarBackgroundContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: Radius.full,
    ...Shadows.large,
  },
  tabBarBackground: {
    flex: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 50,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  logButtonContainer: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  logButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.background,
  },
});
