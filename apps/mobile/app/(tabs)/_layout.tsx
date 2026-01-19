import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/navigation";
import { COLORS } from "@/constants";
import { useColorScheme } from "nativewind";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  // Safe area inset - sanal navigasyon tuslarini hesaba kat
  const bottomPadding = Math.max(insets.bottom, 4);

  // Tema renklerini merkezi dosyadan al
  const themeColors = colorScheme === "dark" ? COLORS.dark : COLORS.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor:
            colorScheme === "dark" ? themeColors.border : `${COLORS.primary}80`,
          borderTopWidth: 1,
          height: 56 + bottomPadding,
          paddingTop: 4,
          paddingBottom: bottomPadding,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Tara",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="barcode-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="settings-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
