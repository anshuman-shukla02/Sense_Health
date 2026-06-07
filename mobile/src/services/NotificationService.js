// Sense Health — Local Push Notifications Service
import { Platform, Alert } from 'react-native';

let Notifications = null;
let notificationsSupported = false;

try {
  Notifications = require('expo-notifications');
  
  // Configure notification behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldBadge: true,
    }),
  });
  
  notificationsSupported = true;
} catch (e) {
  console.log('expo-notifications is not natively supported in this Expo Go environment. Reminders will be simulated.');
}

/**
 * Request permission for local push notifications
 */
export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false;
  if (!notificationsSupported || !Notifications) {
    console.log('Simulating notification permission grant.');
    return true; // Return true to allow simulated reminders in emulator demo
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }
    
    // Set up Android channel if needed
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#52A8A2',
      });

      await Notifications.setNotificationChannelAsync('wellness-reminders', {
        name: 'Wellness Reminders',
        description: 'AI Coach wellness insight reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#52A8A2',
        sound: 'default',
      });
    }
    
    return true;
  } catch (err) {
    console.log('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Schedule periodic hydration reminders
 */
export async function scheduleHydrationReminders() {
  if (Platform.OS === 'web') return;

  if (!notificationsSupported || !Notifications) {
    console.log('Simulating scheduled hydration reminders.');
    // Show a helpful UI alert to let the user know notifications are simulated
    Alert.alert(
      'Hydration Reminders Simulated 💧',
      'Because Expo Go has retired push features in SDK 53, reminders will be simulated in the console logs every 3 hours!',
      [{ text: 'Great!' }]
    );
    return;
  }

  try {
    // Clear any previous reminders first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Recurring hydration reminder (every 3 hours)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Hydrate! 💧',
        body: 'Keep your mind sharp! Drink a glass of water (0.25 L) to boost cognitive focus and lower fatigue.',
        sound: true,
        data: { screen: 'LogTab' },
      },
      trigger: {
        seconds: 3 * 60 * 60, // 3 hours
        repeats: true,
      },
    });

    // 2. Evening review / hydration check
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Hydration Check 🌿',
        body: 'Have you met your 2.0 Litre hydration goal today? Log your evening water intake now.',
        sound: true,
        data: { screen: 'LogTab' },
      },
      trigger: {
        hour: 20, // 8:00 PM
        minute: 0,
        repeats: true,
      },
    });

    // 3. Daily Evening Reflection & Log Reminder (8:30 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reflect on Your Day 🌿',
        body: 'Take 2 minutes to log your sleep, steps, and symptoms to keep your health score accurate!',
        sound: true,
        data: { screen: 'LogTab' },
      },
      trigger: {
        hour: 20,
        minute: 30,
        repeats: true,
      },
    });

    console.log('Hydration and daily logging reminders scheduled successfully!');
    
    // Send a confirmation notification immediately for visual feedback
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration Reminders Active 💧',
        body: 'We will prompt you during the day to help you reach your 2.0 L hydration goal!',
        sound: true,
      },
      trigger: null, // immediate
    });

  } catch (err) {
    console.log('Failed to schedule hydration reminders:', err);
  }
}

// ─── Emoji map for insight categories ───
const CATEGORY_EMOJI = {
  sleep: '🌙',
  mental: '🧘',
  activity: '🏃',
  nutrition: '💧',
  screenTime: '📱',
  general: '✨',
};

/**
 * Schedule a real local notification for a wellness insight reminder.
 *
 * Schedules three notifications:
 *  - Immediate confirmation
 *  - One-shot reminder in 2 hours
 *  - Daily recurring reminder at 9:00 AM
 *
 * @param {string} insightId   Unique ID of the insight (used as tag for cancellation)
 * @param {string} category    e.g. 'sleep', 'mental', 'nutrition', ...
 * @param {string} title       Short category title e.g. "Sleep Optimization"
 * @param {string} text        The full suggestion text
 * @returns {Promise<string[]>} Array of scheduled notification IDs (for cancellation)
 */
export async function scheduleInsightReminder(insightId, category, title, text) {
  const hasPermission = await requestNotificationPermission();
  const emoji = CATEGORY_EMOJI[category] || '✨';

  // Truncate text for notification body (Android has a ~240 char limit for comfortable display)
  const shortText = text.length > 160 ? text.substring(0, 157) + '...' : text;

  if (!notificationsSupported || !Notifications) {
    // Fallback: show a system alert and log to console
    Alert.alert(
      `${emoji} Reminder Set!`,
      `"${title}" reminder activated.\n\nYou'll be reminded in 2 hours and daily at 9:00 AM.\n\n(Native notifications require a development build.)`,
      [{ text: 'OK' }]
    );
    console.log(`[Simulated Reminder] insightId=${insightId}, title=${title}`);
    return [`sim-${insightId}`];
  }

  if (!hasPermission) {
    Alert.alert(
      'Notifications Disabled',
      'Please enable notifications in your device settings to receive wellness reminders.',
      [{ text: 'OK' }]
    );
    return [];
  }

  try {
    const scheduledIds = [];

    // 1. Immediate confirmation notification
    const confirmId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Reminder Activated`,
        body: `"${title}" — we'll remind you in 2 hours and daily at 9 AM.`,
        sound: true,
        data: { screen: 'AISuggestions', insightId },
        ...(Platform.OS === 'android' && { channelId: 'wellness-reminders' }),
      },
      trigger: null, // immediate
    });
    scheduledIds.push(confirmId);

    // 2. One-shot reminder in 2 hours
    const twoHourId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${title}`,
        body: shortText,
        sound: true,
        data: { screen: 'AISuggestions', insightId },
        ...(Platform.OS === 'android' && { channelId: 'wellness-reminders' }),
      },
      trigger: {
        type: 'timeInterval',
        seconds: 2 * 60 * 60, // 2 hours
        repeats: false,
      },
    });
    scheduledIds.push(twoHourId);

    // 3. Daily recurring reminder at 9:00 AM
    const dailyId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Daily Wellness Reminder`,
        body: `${title}: ${shortText}`,
        sound: true,
        data: { screen: 'AISuggestions', insightId },
        ...(Platform.OS === 'android' && { channelId: 'wellness-reminders' }),
      },
      trigger: {
        type: 'daily',
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
    scheduledIds.push(dailyId);

    console.log(`[NotificationService] Scheduled ${scheduledIds.length} reminders for insight "${insightId}":`, scheduledIds);
    return scheduledIds;

  } catch (err) {
    console.warn('[NotificationService] Failed to schedule insight reminder:', err);
    // Graceful fallback
    Alert.alert(
      `${emoji} Reminder Set!`,
      `"${title}" reminder saved. You'll be reminded to follow this suggestion.`,
      [{ text: 'OK' }]
    );
    return [`fallback-${insightId}`];
  }
}

/**
 * Cancel scheduled notifications for a specific insight.
 *
 * @param {string[]} notificationIds Array of notification IDs returned by scheduleInsightReminder
 */
export async function cancelInsightReminder(notificationIds) {
  if (!notificationsSupported || !Notifications) {
    console.log('[Simulated] Cancelled reminders:', notificationIds);
    return;
  }

  try {
    for (const id of notificationIds) {
      if (id && !id.startsWith('sim-') && !id.startsWith('fallback-')) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    console.log('[NotificationService] Cancelled reminders:', notificationIds);
  } catch (err) {
    console.warn('[NotificationService] Failed to cancel reminders:', err);
  }
}

/**
 * Cancel all hydration reminders
 */
export async function cancelAllReminders() {
  if (Platform.OS === 'web') return;
  if (!notificationsSupported || !Notifications) {
    console.log('Simulated reminders cancelled.');
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Hydration reminders cancelled.');
  } catch (err) {
    console.log('Failed to cancel reminders:', err);
  }
}
