import React from 'react';
import { Stack } from 'expo-router';
import { I18nManager, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}
      />
    </View>
  );
}
