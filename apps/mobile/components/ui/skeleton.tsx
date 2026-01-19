import { useEffect, useRef } from "react";
import { Animated, View, ViewProps } from "react-native";

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  variant?: "text" | "circular" | "rectangular";
}

/**
 * Skeleton placeholder componenti
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius,
  variant = "rectangular",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  // Pulse animasyonu
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  // Variant'a göre borderRadius hesapla
  const getRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    switch (variant) {
      case "circular":
        return typeof height === "number" ? height / 2 : 9999;
      case "text":
        return 4;
      default:
        return 8;
    }
  };

  return (
    <Animated.View
      className={`bg-secondary ${className}`}
      style={[
        {
          width: typeof width === "number" ? width : undefined,
          height,
          borderRadius: getRadius(),
          opacity,
        },
        typeof width === "string" ? { width: width as any } : undefined,
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Skeleton grubu wrapper'ı
 */
export function SkeletonGroup({ children }: { children: React.ReactNode }) {
  return <View className="gap-3">{children}</View>;
}
