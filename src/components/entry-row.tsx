import { Pressable, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { MacroBits } from '@/components/macro-bits';
import { ThemedText } from '@/components/themed-text';
import type { DayEntry } from '@/db/repo';

type Props = {
  entry: DayEntry;
  onPress: () => void;
  onDelete: () => void;
};

export function EntryRow({ entry, onPress, onDelete }: Props) {
  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <Pressable
          accessibilityLabel={`Delete ${entry.name}`}
          className="w-[88px] items-center justify-center bg-danger"
          onPress={() => {
            methods.close();
            onDelete();
          }}>
          <ThemedText type="smallBold" className="text-white">
            Delete
          </ThemedText>
        </Pressable>
      )}>
      <Pressable onPress={onPress} className="flex-row items-center gap-3 py-2 active:opacity-60 bg-background-element">
        <View className="flex-1">
          <ThemedText numberOfLines={1}>{entry.name}</ThemedText>
          <MacroBits macros={entry} grams={entry.grams} />
        </View>
        <ThemedText className="font-bold">{Math.round(entry.kcal)}</ThemedText>
      </Pressable>
    </Swipeable>
  );
}
