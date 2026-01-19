import { COLORS } from "@/constants";
import { ActivityIndicator, Text, View } from "react-native";

interface LoadingProps {
  size?: "small" | "large";
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading spinner componenti
 */
export function Loading({
  size = "large",
  message,
  fullScreen = false,
}: LoadingProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={COLORS.primary} />
      {message && (
        <Text className="text-muted-foreground mt-4 text-center">
          {message}
        </Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        {content}
      </View>
    );
  }

  return <View className="items-center justify-center py-8">{content}</View>;
}
