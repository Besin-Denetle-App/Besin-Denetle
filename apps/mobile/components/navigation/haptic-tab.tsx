import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useHapticsStore } from "../../stores/haptics.store";

/**
 * Tab butonu - basınca hafif titreşim verir (selection feedback).
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  const selection = useHapticsStore((state) => state.selection);

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Haptic selection feedback
        selection();
        props.onPressIn?.(ev);
      }}
    />
  );
}
