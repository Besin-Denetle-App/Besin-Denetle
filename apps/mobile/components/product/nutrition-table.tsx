import { COLORS } from "@/constants";
import type { INutritionTable } from "@besin-denetle/shared";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Text, View } from "react-native";

interface NutritionTableProps {
  nutrition: INutritionTable | null;
}

// Besin değeri label'ları (Türkçe)
const NUTRITION_LABELS: Record<string, string> = {
  servingSize: "Porsiyon",
  calories: "Kalori",
  protein: "Protein",
  carbohydrates: "Karbonhidrat",
  sugars: "Şeker",
  fat: "Yağ",
  saturatedFat: "Doymuş Yağ",
  fiber: "Lif",
  sodium: "Sodyum",
  salt: "Tuz",
};

// Besin değeri birimleri
const NUTRITION_UNITS: Record<string, string> = {
  servingSize: "",
  calories: "kcal",
  protein: "g",
  carbohydrates: "g",
  sugars: "g",
  fat: "g",
  saturatedFat: "g",
  fiber: "g",
  sodium: "mg",
  salt: "g",
};

/**
 * Besin değerleri tablosu
 */
export function NutritionTable({ nutrition }: NutritionTableProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = colorScheme === "dark" ? COLORS.dark : COLORS.light;

  if (!nutrition) {
    return (
      <View className="bg-secondary/30 rounded-2xl p-6 items-center">
        <Ionicons
          name="nutrition-outline"
          size={40}
          color={themeColors.divider}
        />
        <Text className="text-muted-foreground mt-3 text-center">
          Besin değerleri bulunamadı
        </Text>
      </View>
    );
  }

  // Gösterilecek değerlerin sırası
  const orderedKeys = [
    "servingSize",
    "calories",
    "protein",
    "carbohydrates",
    "sugars",
    "fat",
    "saturatedFat",
    "fiber",
    "sodium",
    "salt",
  ];

  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Başlık */}
      <View className="bg-secondary/50 px-4 py-3 border-b border-border">
        <Text className="text-foreground font-semibold">
          Besin Değerleri (100g)
        </Text>
      </View>

      {/* Tablo satırları */}
      {orderedKeys.map((key, index) => {
        const value = nutrition[key];
        if (value === undefined || value === null) return null;

        const label = NUTRITION_LABELS[key] || key;
        const unit = NUTRITION_UNITS[key] || "";
        const displayValue =
          typeof value === "number"
            ? `${value}${unit ? " " + unit : ""}`
            : String(value);

        return (
          <View
            key={key}
            className={`flex-row justify-between px-4 py-3 ${
              index % 2 === 0 ? "bg-card" : "bg-secondary/20"
            }`}
          >
            <Text className="text-foreground">{label}</Text>
            <Text className="text-foreground font-medium">{displayValue}</Text>
          </View>
        );
      })}
    </View>
  );
}
