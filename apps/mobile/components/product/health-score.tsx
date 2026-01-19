import { Text, View } from "react-native";

interface HealthScoreProps {
  score: number; // 1-10 aralığında
}

/**
 * Sağlık skoru badge'i
 * Renk kodları: 1-3 kırmızı, 4-6 turuncu, 7-10 yeşil
 */
export function HealthScore({ score }: HealthScoreProps) {
  // Skor aralığına göre renk döndürür
  const getScoreColor = () => {
    if (score <= 3)
      return {
        bg: "bg-red-500/20",
        text: "text-red-500",
        border: "border-red-500/30",
      };
    if (score <= 6)
      return {
        bg: "bg-orange-500/20",
        text: "text-orange-500",
        border: "border-orange-500/30",
      };
    return {
      bg: "bg-green-500/20",
      text: "text-green-500",
      border: "border-green-500/30",
    };
  };

  // Skor aralığına göre label döndürür
  const getScoreLabel = () => {
    if (score <= 3) return "Dikkatli Tüketin";
    if (score <= 6) return "Orta Düzey";
    return "Sağlıklı";
  };

  const colors = getScoreColor();

  return (
    <View className="items-center">
      {/* Skor dairesi */}
      <View
        className={`w-24 h-24 rounded-full ${colors.bg} ${colors.border} border-2 items-center justify-center mb-3`}
      >
        <Text className={`text-4xl font-bold ${colors.text}`}>{score}</Text>
        <Text className={`text-xs ${colors.text} opacity-80`}>/10</Text>
      </View>

      {/* Skor etiketi */}
      <Text className={`font-semibold text-base ${colors.text}`}>
        {getScoreLabel()}
      </Text>
    </View>
  );
}
