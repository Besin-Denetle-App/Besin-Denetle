import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_CONFIG, SHADOWS } from '../../constants';
import { lightImpact } from '../../utils/haptics';

// Sabitleri constants'tan al
const { confirmationThreshold, scanDebounceMs } = APP_CONFIG.scanner;

interface BarcodeScannerProps {
    visible: boolean;
    onClose: () => void;
    onBarcodeConfirmed?: (barcode: string) => void;
}

export function BarcodeScanner({ visible, onClose, onBarcodeConfirmed }: BarcodeScannerProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Çoklu okuma için state
    const scanCountRef = useRef<{ [key: string]: number }>({});
    const lastScanTimeRef = useRef<number>(0);

    // Modal kapandığında state'leri sıfırla
    useEffect(() => {
        if (!visible) {
            setScannedBarcode(null);
            setShowConfirmation(false);
            scanCountRef.current = {};
            lastScanTimeRef.current = 0;
        }
    }, [visible]);

    // İzin kontrolü
    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View className="flex-1 bg-background items-center justify-center px-6">
                    <Ionicons name="camera-outline" size={80} className="text-muted-foreground mb-6" />
                    <Text className="text-foreground text-xl font-bold mb-4 text-center">
                        Kamera İzni Gerekli
                    </Text>
                    <Text className="text-muted-foreground text-center mb-8">
                        Barkod okuyabilmek için kamera erişimine izin vermeniz gerekiyor.
                    </Text>
                    <TouchableOpacity
                        onPress={requestPermission}
                        className="bg-primary px-8 py-4 rounded-full mb-4"
                    >
                        <Text className="text-primary-foreground font-semibold text-base">
                            İzin Ver
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} className="px-8 py-4">
                        <Text className="text-muted-foreground font-medium">İptal</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (showConfirmation) return;

        const now = Date.now();
        const timeSinceLastScan = now - lastScanTimeRef.current;

        // Debounce süresi içinde tekrar okuma yapılmışsa sayacı artır
        if (timeSinceLastScan < scanDebounceMs) {
            scanCountRef.current[data] = (scanCountRef.current[data] || 0) + 1;

            // Threshold'a ulaşıldıysa onay ekranını göster
            if (scanCountRef.current[data] >= confirmationThreshold) {
                // Haptic feedback - barkod okundu
                lightImpact();
                
                setScannedBarcode(data);
                setShowConfirmation(true);
                scanCountRef.current = {}; // Sayacı sıfırla
            }
        } else {
            // Yeni tarama başlat
            scanCountRef.current = { [data]: 1 };
        }

        lastScanTimeRef.current = now;
    };

    const handleConfirm = () => {
        if (scannedBarcode && onBarcodeConfirmed) {
            onBarcodeConfirmed(scannedBarcode);
        }
        setShowConfirmation(false);
        onClose();
    };

    const handleRetry = () => {
        setScannedBarcode(null);
        setShowConfirmation(false);
        scanCountRef.current = {};
    };

    // Onay Ekranı
    if (showConfirmation && scannedBarcode) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View className="flex-1 bg-background items-center justify-center px-6">
                    {/* Başarı İkonu */}
                    <View className="bg-primary/10 w-24 h-24 rounded-full items-center justify-center mb-6">
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                    </View>

                    {/* Başlık */}
                    <Text className="text-foreground text-2xl font-bold mb-2 text-center">
                        Barkod Okundu
                    </Text>

                    {/* Barkod Numarası */}
                    <View className="bg-secondary/50 px-6 py-4 rounded-2xl mb-8 border border-border">
                        <Text className="text-muted-foreground text-sm mb-1">Barkod Numarası:</Text>
                        <Text className="text-foreground text-xl font-mono font-bold">
                            {scannedBarcode}
                        </Text>
                    </View>

                    {/* Bilgi Metni */}
                    <Text className="text-muted-foreground text-center mb-8 px-4">
                        Bu barkod doğru mu? Onaylarsanız ürün bilgilerini görebilirsiniz.
                    </Text>

                    {/* Butonlar */}
                    <View className="w-full px-4 gap-3">
                        {/* Onayla Butonu */}
                        <TouchableOpacity
                            onPress={handleConfirm}
                            className="bg-primary px-8 py-4 rounded-full items-center"
                        >
                            <Text className="text-primary-foreground font-semibold text-base">
                                ✓ Doğru, Devam Et
                            </Text>
                        </TouchableOpacity>

                        {/* Tekrar Okut Butonu */}
                        <TouchableOpacity
                            onPress={handleRetry}
                            className="bg-secondary px-8 py-4 rounded-full items-center"
                        >
                            <Text className="text-foreground font-semibold text-base">
                                ↻ Tekrar Okut
                            </Text>
                        </TouchableOpacity>

                        {/* İptal Butonu */}
                        <TouchableOpacity onPress={onClose} className="px-8 py-4 items-center">
                            <Text className="text-muted-foreground font-medium">İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    // Kamera Ekranı
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black">
                {/* Kamera Görünümü */}
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: APP_CONFIG.scanner.supportedFormats as any,
                    }}
                />

                {/* Tarama Rehberi Overlay */}
                <View className="flex-1 items-center justify-center">
                    <View className="absolute top-0 left-0 right-0 bottom-0">
                        {/* Üst karartma */}
                        <View className="flex-1 bg-black/50" />

                        {/* Orta kısım - tarama alanı */}
                        <View className="flex-row h-64">
                            <View className="flex-1 bg-black/50" />
                            <View className="w-80 border-2 border-primary rounded-2xl" />
                            <View className="flex-1 bg-black/50" />
                        </View>

                        {/* Alt karartma */}
                        <View className="flex-1 bg-black/50" />
                    </View>

                    {/* Talimat Metni */}
                    <View className="absolute bottom-32 left-0 right-0 items-center">
                        <View className="bg-black/70 px-6 py-4 rounded-full">
                            <Text className="text-white text-base font-medium text-center">
                                Barkodu çerçeve içinde tutun
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Kapat Butonu */}
                <TouchableOpacity
                    onPress={onClose}
                    className="absolute top-12 right-6 bg-black/70 w-12 h-12 rounded-full items-center justify-center"
                    style={SHADOWS.sm}
                >
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}
