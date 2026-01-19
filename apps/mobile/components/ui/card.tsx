import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outlined";
  children: React.ReactNode;
}

/**
 * Kart componenti
 */
export function Card({
  variant = "default",
  children,
  className = "",
  style,
  ...props
}: CardProps) {
  // Variant stilleri
  const variantStyles = {
    default: "bg-card",
    elevated: "bg-card shadow-lg",
    outlined: "bg-card border border-border",
  };

  // Elevated için shadow
  const shadowStyle =
    variant === "elevated"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }
      : {};

  return (
    <View
      className={`rounded-2xl p-4 ${variantStyles[variant]} ${className}`}
      style={[shadowStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}
