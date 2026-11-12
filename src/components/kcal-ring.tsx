import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { formatKcal, progress } from '@/lib/macros';

type Props = {
  eaten: number;
  goal: number;
};

const SIZE = 118;
const STROKE = 10;

export function KcalRing({ eaten, goal }: Props) {
  const [track, primary, danger] = useCSSVariable([
    '--color-background-selected',
    '--color-primary',
    '--color-danger',
  ]) as string[];
  const over = goal > 0 && eaten > goal;
  const remaining = Math.max(0, Math.round(goal - eaten));
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = progress(eaten, goal);
  const dash = circumference * (over ? 1 : filled);

  return (
    <View className="items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke={track}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke={over ? danger : primary}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View className="absolute items-center">
        <ThemedText className="text-[28px] leading-[32px] font-bold">
          {over ? formatKcal(eaten - goal) : formatKcal(remaining)}
        </ThemedText>
        <ThemedText type="small" className="text-foreground-secondary">
          {over ? 'kcal over' : 'kcal left'}
        </ThemedText>
      </View>
    </View>
  );
}
