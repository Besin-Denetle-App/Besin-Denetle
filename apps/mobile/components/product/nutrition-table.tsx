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
  energy: "Enerji",
  fat: "Yağ",
  saturatedFat: "Doymuş Yağ",  // └─ Alt
  cholesterol: "Kolesterol",   // └─ Alt
  carbohydrates: "Karbonhidrat",
  sugars: "Şeker",      // └─ Alt
  polyols: "Polioller", // └─ Alt
  starch: "Nişasta",    // └─ Alt
  fiber: "Lif",
  protein: "Protein",
  salt: "Tuz",
};

// Besin değeri birimleri
const NUTRITION_UNITS: Record<string, string> = {
  servingSize: "",
  energy: "kcal",
  fat: "g",
  saturatedFat: "g",
  cholesterol: "mg",
  carbohydrates: "g",
  sugars: "g",
  polyols: "g",
  starch: "g",
  fiber: "g",
  protein: "g",
  salt: "g",
};

// Hiyerarşik yapı: hangi alanlar alt seviye (girintili)
const SUB_ITEMS = new Set([
  "saturatedFat",
  "cholesterol",
  "sugars",
  "polyols",
  "starch",
]);

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

  // Gösterilecek değerlerin sırası (hiyerarşik)
  const orderedKeys = [
    "servingSize",
    "energy",
    "fat",
    "saturatedFat", // └─ Alt
    "cholesterol", // └─ Alt
    "carbohydrates",
    "sugars", // └─ Alt
    "polyols", // └─ Alt
    "starch", // └─ Alt
    "fiber",
    "protein",
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

        const isSubItem = SUB_ITEMS.has(key);

        return (
          <View
            key={key}
            className={`flex-row justify-between py-3 ${index % 2 === 0 ? "bg-card" : "bg-secondary/20"
              } ${isSubItem ? "pl-8 pr-4" : "px-4"}`}
          >
            <Text
              className={`text-foreground ${isSubItem ? "text-sm text-muted-foreground" : ""}`}
            >
              {isSubItem ? "└─ " : ""}
              {label}
            </Text>
            <Text className={`font-medium ${isSubItem ? "text-sm text-muted-foreground" : "text-foreground"}`}>
              {displayValue}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
