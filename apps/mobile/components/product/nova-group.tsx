import { Text, View } from "react-native";

interface NovaGroupProps {
    group: number; // 1-4 aralığında
}

/**
 * NOVA sınıflandırma badge'i
 * NOVA 1: İşlenmemiş/minimal işlenmiş (yeşil)
 * NOVA 2: İşlenmiş mutfak malzemeleri (sarı)
 * NOVA 3: İşlenmiş gıdalar (turuncu)
 * NOVA 4: Ultra işlenmiş gıdalar (kırmızı)
 */
export function NovaGroup({ group }: NovaGroupProps) {
    const getGroupStyle = () => {
        switch (group) {
            case 1:
                return {
                    bg: "bg-green-500/20",
                    text: "text-green-500",
                    border: "border-green-500/30",
                    label: "Doğal",
                };
            case 2:
                return {
                    bg: "bg-yellow-500/20",
                    text: "text-yellow-500",
                    border: "border-yellow-500/30",
                    label: "Hafif İşlenmiş",
                };
            case 3:
                return {
                    bg: "bg-orange-500/20",
                    text: "text-orange-500",
                    border: "border-orange-500/30",
                    label: "İşlenmiş",
                };
            case 4:
            default:
                return {
                    bg: "bg-red-500/20",
                    text: "text-red-500",
                    border: "border-red-500/30",
                    label: "Ultra İşlenmiş",
                };
        }
    };

    const style = getGroupStyle();

    return (
        <View className="items-center">
            {/* NOVA grubu dairesi */}
            <View
                className={`w-16 h-16 rounded-full ${style.bg} ${style.border} border-2 items-center justify-center mb-2`}
            >
                <Text className={`text-xs ${style.text} opacity-80`}>NOVA</Text>
                <Text className={`text-2xl font-bold ${style.text}`}>{group}</Text>
            </View>

            {/* NOVA etiketi */}
            <Text className={`font-medium text-sm ${style.text}`}>
                {style.label}
            </Text>
        </View>
    );
}
