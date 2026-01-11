import { showInfoToast } from '@/components/feedback';
import { ProductPopup } from '@/components/product';
import { BarcodeScanner } from '@/components/scanner';
import { ThemeToggle } from '@/components/ui';
import type { IProduct } from '@besin-denetle/shared';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isRateLimitError, parseApiError } from '../../services/api';
import * as productService from '../../services/product.service';
import { useProductStore } from '../../stores/product.store';

export default function ScanScreen() {
    const { colorScheme } = useColorScheme();
    const { setProduct, setBarcode } = useProductStore();
    const [showScanner, setShowScanner] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    
    // API state
    const [isLoading, setIsLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<IProduct | null>(null);
    const [currentBarcodeId, setCurrentBarcodeId] = useState<string | null>(null);
    const [popupMode, setPopupMode] = useState<'confirm' | 'non-food'>('confirm');
    const [error, setError] = useState<string | null>(null);

    // Kameradan barkod okunduğunda
    const handleBarcodeScanned = (barcode: string) => {
        setBarcodeInput(barcode);
        setShowScanner(false);
    };

    // Sorgula butonuna basıldığında
    const handleSearch = async () => {
        if (!barcodeInput.trim()) return;

        setError(null);
        setIsLoading(true);
        setShowPopup(true);
        setPopupMode('confirm');

        try {
            const response = await productService.scanBarcode(barcodeInput.trim());
            
            // barcodeType kontrolü: 1=yiyecek, 2=içecek, diğerleri=non-food
            if (response.barcodeType !== 1 && response.barcodeType !== 2) {
                setPopupMode('non-food');
                setCurrentBarcodeId(response.product.barcode_id);
                setCurrentProduct(null);
            } else {
                setPopupMode('confirm');
                setCurrentProduct(response.product);
                setCurrentBarcodeId(response.product.barcode_id);
            }
        } catch (err) {
            const errorMessage = parseApiError(err);
            // Rate limit hatası ise popup'ı kapat, ana ekranda göster
            if (isRateLimitError(err)) {
                setShowPopup(false);
            }
            setError(errorMessage);
            setCurrentProduct(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Ürün onaylandığında (EVET)
    const handleConfirm = async () => {
        if (!currentProduct) return;

        // Product ve barcode'u store'a kaydet (detay sayfasında kullanılacak)
        setProduct(currentProduct);
        setBarcode(barcodeInput.trim());

        setShowPopup(false);
        // Ürün detay sayfasına git
        router.push(`/product/${currentProduct.id}` as any);
    };

    // Ürün reddedildiğinde (HAYIR)
    const handleReject = async () => {
        if (!currentProduct) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await productService.rejectProduct(currentProduct.id);
            if (response.nextProduct) {
                setCurrentProduct(response.nextProduct);
                showInfoToast('Sonraki ürün yüklendi');
            } else if (response.noMoreVariants) {
                setError('Başka varyant bulunamadı.');
                setCurrentProduct(null);
            }
        } catch (err) {
            const errorMessage = parseApiError(err);
            // Rate limit hatası ise popup'ı kapat, ana ekranda göster
            if (isRateLimitError(err)) {
                setShowPopup(false);
                setCurrentProduct(null);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Non-food barkod bildir
    const handleFlag = async () => {
        if (!currentBarcodeId) return;

        setIsLoading(true);
        try {
            await productService.flagBarcode(currentBarcodeId);
            showInfoToast('Bildiriminiz alındı');
            handleClosePopup();
        } catch (err) {
            setError(parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    // Popup kapatıldığında
    const handleClosePopup = () => {
        setShowPopup(false);
        setCurrentProduct(null);
        setCurrentBarcodeId(null);
        setPopupMode('confirm');
        setError(null);
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

                {/* Hata Mesajı */}
                {error && !showPopup && (
                    <View className="w-full bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-6">
                        <Text className="text-destructive text-center">{error}</Text>
                    </View>
                )}

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
                        editable={!isLoading}
                    />
                </View>

                {/* Barkod Tara Butonu */}
                <TouchableOpacity
                    className="bg-primary w-full py-4 rounded-2xl items-center mb-4"
                    activeOpacity={0.7}
                    onPress={() => setShowScanner(true)}
                    disabled={isLoading}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="barcode-outline" size={24} color="white" />
                        <Text className="text-primary-foreground font-bold text-base ml-2">
                            Kamera ile Tara
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Sorgula Butonu */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-2xl items-center flex-row justify-center ${
                        barcodeInput && !isLoading ? 'bg-accent' : 'bg-muted'
                    }`}
                    activeOpacity={0.7}
                    disabled={!barcodeInput || isLoading}
                    onPress={handleSearch}
                >
                    {isLoading && !showPopup ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons
                                name="search"
                                size={20}
                                color={barcodeInput ? '#FFFFFF' : colorScheme === 'dark' ? '#757575' : '#A3A3A3'}
                            />
                            <Text
                                className={`font-bold text-base ml-2 ${
                                    barcodeInput ? 'text-accent-foreground' : 'text-muted-foreground'
                                }`}
                            >
                                Sorgula
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Tema Değiştirme Butonu */}
            <ThemeToggle />

            {/* Barkod Scanner Modal */}
            <BarcodeScanner
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onBarcodeConfirmed={handleBarcodeScanned}
            />

            {/* Ürün Onay Popup */}
            <ProductPopup
                visible={showPopup}
                product={currentProduct}
                isLoading={isLoading}
                mode={popupMode}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onClose={handleClosePopup}
                onFlag={handleFlag}
            />
        </SafeAreaView>
    );
}
