import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/navigation';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6', // Her iki modda da mor
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#FAFAFA', // Material Design 3
          borderTopColor: colorScheme === 'dark' ? '#2C2C2C' : '#8B5CF680', // Dark: Gri, Light: Yarı saydam mor
          borderTopWidth: 1,
          height: 56, // 64px - Modern mobil standart (paddingBottom ile safe area eklenir)
          paddingTop: 4,
          paddingBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Tara',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="barcode-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="settings-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
