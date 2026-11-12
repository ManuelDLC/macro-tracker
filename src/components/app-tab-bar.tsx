import { router } from 'expo-router';
import { type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { defaultMealForTime } from '@/lib/meals';

const TABS = [
  { name: 'index', label: 'Today', ios: 'clock', android: 'schedule' },
  { name: 'settings', label: 'Goals', ios: 'target', android: 'target' },
] as const;

export function AppTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [primary, secondary] = useCSSVariable([
    '--color-primary',
    '--color-foreground-secondary',
  ]) as string[];
  const active = state.routes[state.index]?.name;
  const today = state.routes.find((route) => route.name === 'index');
  const goals = state.routes.find((route) => route.name === 'settings');

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ bottom: Math.max(insets.bottom, 10) }}>
      <View className="flex-row items-center rounded-full px-2 py-2 bg-background-element">
        <TabButton
          label={TABS[0].label}
          ios={TABS[0].ios}
          android={TABS[0].android}
          selected={active === TABS[0].name}
          color={active === TABS[0].name ? primary : secondary}
          onPress={() => today && navigateToTab(today.key)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add food"
          onPress={() =>
            router.push({ pathname: '/add', params: { meal: defaultMealForTime() } })
          }
          className="w-14 h-14 mx-2 rounded-full items-center justify-center bg-primary active:opacity-80">
          <AppIcon ios="plus" android="add" size={30} color="#ffffff" />
        </Pressable>
        <TabButton
          label={TABS[1].label}
          ios={TABS[1].ios}
          android={TABS[1].android}
          selected={active === TABS[1].name}
          color={active === TABS[1].name ? primary : secondary}
          onPress={() => goals && navigateToTab(goals.key)}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  ios,
  android,
  selected,
  color,
  onPress,
}: {
  label: string;
  ios: 'clock' | 'target';
  android: 'schedule' | 'target';
  selected: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="w-[76px] items-center gap-0.5 py-1 active:opacity-70">
      <AppIcon ios={ios} android={android} size={22} color={color} />
      <ThemedText type="small" className="text-[12px] leading-[16px]" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
