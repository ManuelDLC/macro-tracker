import { Pressable, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { MacroLine } from '@/components/macro-line';
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
      <View className="bg-background-element">
        <Pressable
          onPress={onPress}
          className="flex-row items-center gap-2 px-4 py-3 active:opacity-60">
          <View className="flex-1">
            <ThemedText numberOfLines={1}>{entry.name}</ThemedText>
            <MacroLine macros={entry} numberOfLines={1} />
          </View>
          <ThemedText type="small" className="text-foreground-secondary">
            {Math.round(entry.grams)} g
          </ThemedText>
        </Pressable>
      </View>
    </Swipeable>
  );
}
