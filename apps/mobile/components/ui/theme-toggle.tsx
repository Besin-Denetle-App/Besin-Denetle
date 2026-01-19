/**
 * Tema değiştirme butonu - light/dark mod geçişi
 */
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { TouchableOpacity } from "react-native";
import { SHADOWS } from "../../constants";

interface ThemeToggleProps {
  /** Buton pozisyonu */
  position?: "bottom-right" | "bottom-left";
}

/**
 * Floating tema butonu
 */
export function ThemeToggle({ position = "bottom-right" }: ThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  const positionClass = position === "bottom-right" ? "right-6" : "left-6";

  return (
    <TouchableOpacity
      onPress={toggleColorScheme}
      className={`absolute bottom-6 ${positionClass} bg-primary w-14 h-14 rounded-full items-center justify-center`}
      style={SHADOWS.md}
    >
      <Ionicons
        name={colorScheme === "dark" ? "sunny" : "moon"}
        size={24}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
}
