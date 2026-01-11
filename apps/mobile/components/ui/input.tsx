import { useColorScheme } from 'nativewind';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Yeniden kullanılabilir input componenti
 */
export function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="w-full">
      {label && (
        <Text className="text-foreground font-medium mb-2">{label}</Text>
      )}
      <TextInput
        placeholderTextColor={colorScheme === 'dark' ? '#757575' : '#A3A3A3'}
        className={`
          bg-secondary/50 border rounded-2xl px-4 py-4 text-foreground text-base
          ${error ? 'border-destructive' : 'border-border'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <Text className="text-destructive text-sm mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-muted-foreground text-sm mt-1">{helperText}</Text>
      )}
    </View>
  );
}
