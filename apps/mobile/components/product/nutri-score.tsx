import { Text, View } from "react-native";

interface NutriScoreProps {
  score: string; // A, B, C, D veya E
}

/**
 * Nutri-Score badge'i
 * A: Yeşil (en iyi), B: Açık yeşil, C: Sarı, D: Turuncu, E: Kırmızı (en kötü)
 */
export function NutriScore({ score }: NutriScoreProps) {
  const getScoreStyle = () => {
    switch (score.toUpperCase()) {
      case "A":
        return {
          bg: "bg-green-600/20",
          text: "text-green-600",
          border: "border-green-600/30",
          label: "Çok İyi",
        };
      case "B":
        return {
          bg: "bg-green-500/20",
          text: "text-green-500",
          border: "border-green-500/30",
          label: "İyi",
        };
      case "C":
        return {
          bg: "bg-yellow-500/20",
          text: "text-yellow-500",
          border: "border-yellow-500/30",
          label: "Orta",
        };
      case "D":
        return {
          bg: "bg-orange-500/20",
          text: "text-orange-500",
          border: "border-orange-500/30",
          label: "Düşük",
        };
      case "E":
      default:
        return {
          bg: "bg-red-500/20",
          text: "text-red-500",
          border: "border-red-500/30",
          label: "Kötü",
        };
    }
  };

  const style = getScoreStyle();

  return (
    <View className="items-center">
      {/* Nutri-Score dairesi */}
      <View
        className={`w-16 h-16 rounded-full ${style.bg} ${style.border} border-2 items-center justify-center mb-2`}
      >
        <Text className={`text-xs ${style.text} opacity-80`}>Nutri</Text>
        <Text className={`text-2xl font-bold ${style.text}`}>
          {score.toUpperCase()}
        </Text>
      </View>

      {/* Nutri-Score etiketi */}
      <Text className={`font-medium text-sm ${style.text}`}>
        {style.label}
      </Text>
    </View>
  );
}
