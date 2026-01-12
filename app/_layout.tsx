import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nManager, Platform } from 'react-native';
import { useEffect } from 'react';

// Force RTL for Arabic - only on first load
if (!I18nManager.isRTL && Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  // Note: App needs to reload for RTL to take effect
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="employees" />
        <Stack.Screen name="branches" />
        <Stack.Screen name="users" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="employee-details" />
        <Stack.Screen name="add-employee" />
        <Stack.Screen name="edit-employee" />
        <Stack.Screen name="add-task" />
      </Stack>
    </AuthProvider>
  );
}