import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useHapticsStore } from '../../stores/haptics.store';

/**
 * Haptic feedback'li tab butonu
 * Selection titreşimi - çok hafif, sadece hissettiren
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  const selection = useHapticsStore((state) => state.selection);

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Çok hafif selection titreşimi
        selection();
        props.onPressIn?.(ev);
      }}
    />
  );
}


