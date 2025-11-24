import { BarcodeScanner } from '@/components/barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const [showScanner, setShowScanner] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');

    const handleBarcodeScanned = (barcode: string) => {
        setBarcodeInput(barcode);
        setShowScanner(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 items-center justify-center px-6">
                {/* Başlık */}
                <Text className="text-foreground text-2xl font-bold mb-2">
                    Barkod Tara
                </Text>
                <Text className="text-muted-foreground text-center mb-8">
                    Barkodu manuel girin veya kamera ile tarayın
                </Text>

                {/* Manuel Barkod Girişi */}
                <View className="w-full mb-6">
                    <Text className="text-foreground font-medium mb-2">Barkod Numarası</Text>
                    <TextInput
                        value={barcodeInput}
                        onChangeText={setBarcodeInput}
                        placeholder="Örn: 8690632006314"
                        placeholderTextColor={colorScheme === 'dark' ? '#A0A0A0' : '#757575'}
                        keyboardType="numeric"
                        className="bg-secondary/50 border border-border rounded-2xl px-4 py-4 text-foreground text-base font-mono"
                    />
                </View>

                {/* Barkod Tara Butonu */}
                <TouchableOpacity
                    className="bg-primary w-full py-4 rounded-2xl items-center mb-4"
                    activeOpacity={0.7}
                    onPress={() => setShowScanner(true)}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="barcode-outline" size={24} color="white" />
                        <Text className="text-primary-foreground font-bold text-base ml-2">
                            Kamera ile Tara
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Ara Butonu (Şimdilik disabled) */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-2xl items-center ${barcodeInput ? 'bg-accent' : 'bg-muted'}`}
                    activeOpacity={0.7}
                    disabled={!barcodeInput}
                >
                    <Text className={`font-bold text-base ${barcodeInput ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                        Ürünü Ara
                    </Text>
                </TouchableOpacity>
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

            {/* Barkod Scanner Modal */}
            <BarcodeScanner
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onBarcodeConfirmed={handleBarcodeScanned}
            />
        </SafeAreaView>
    );
}
