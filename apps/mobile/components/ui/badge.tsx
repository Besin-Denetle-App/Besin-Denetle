import { Text, View, ViewProps } from "react-native";

interface BadgeProps extends ViewProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  children: React.ReactNode;
}

/**
 * Badge componenti - alerjen, durum göstergesi vb. için
 */
export function Badge({
  variant = "default",
  size = "md",
  children,
  className = "",
  ...props
}: BadgeProps) {
  // Variant arka plan stilleri
  const variantStyles = {
    default: "bg-secondary/50 border-border",
    success: "bg-green-500/20 border-green-500/30",
    warning: "bg-orange-500/20 border-orange-500/30",
    error: "bg-red-500/20 border-red-500/30",
    info: "bg-blue-500/20 border-blue-500/30",
  };

  // Variant yazı renkleri
  const textStyles = {
    default: "text-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-orange-600 dark:text-orange-400",
    error: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  // Boyut stilleri
  const sizeStyles = {
    sm: "px-2 py-0.5",
    md: "px-3 py-1",
  };

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-sm",
  };

  return (
    <View
      className={`rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <Text
        className={`font-medium ${textStyles[variant]} ${textSizeStyles[size]}`}
      >
        {children}
      </Text>
    </View>
  );
}
