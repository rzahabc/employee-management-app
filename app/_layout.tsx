import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nManager } from 'react-native';
import { useEffect } from 'react';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
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