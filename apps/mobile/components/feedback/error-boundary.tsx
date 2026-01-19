import { Ionicons } from "@expo/vector-icons";
import { Component, ErrorInfo, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary
 *
 * Yakalanmamış hataları global olarak yakalar.
 * _layout.tsx'te root component'i sarmalıyor.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Production'da buraya analytics entegrasyonu eklenebilir
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background items-center justify-center px-6">
          {/* Hata ikonu */}
          <View className="bg-destructive/10 w-24 h-24 rounded-full items-center justify-center mb-6">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>

          {/* Başlık */}
          <Text className="text-foreground text-2xl font-bold mb-2 text-center">
            Bir şeyler ters gitti
          </Text>

          {/* Açıklama */}
          <Text className="text-muted-foreground text-center mb-6">
            Beklenmeyen bir hata oluştu.{"\n"}
            Lütfen uygulamayı yeniden başlatmayı deneyin.
          </Text>

          {/* Dev modda hata detayı göster */}
          {__DEV__ && this.state.error && (
            <View className="bg-secondary/50 border border-border rounded-xl px-4 py-3 mb-6 w-full">
              <Text className="text-muted-foreground text-xs font-mono">
                {this.state.error.message}
              </Text>
            </View>
          )}

          {/* Tekrar Dene Butonu */}
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-primary px-8 py-4 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Tekrar Dene
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
