import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <SafeAreaView className="flex-1 bg-background items-center justify-center">
            <View className="items-center">
                <TouchableOpacity
                    className="bg-primary w-48 h-48 rounded-full items-center justify-center shadow-lg"
                    activeOpacity={0.7}
                >
                    <Ionicons name="barcode-outline" size={64} color="white" />
                    <Text className="text-primary-foreground font-bold text-lg mt-2 text-center px-4">
                        Barkod Tara
                    </Text>
                </TouchableOpacity>
                <Text className="text-muted-foreground mt-6 text-base">
                    Taramak için butona basın
                </Text>
            </View>

            {/* Tema Değiştirme Butonu - Sağ Alt Köşe Sabit */}
            <TouchableOpacity
                onPress={toggleColorScheme}
                className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4.65,
                    elevation: 8,
                }}
            >
                <Ionicons name={colorScheme === 'dark' ? "sunny" : "moon"} size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
