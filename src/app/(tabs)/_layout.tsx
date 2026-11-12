import { NativeTabs } from 'expo-router/native-tabs';
import { useCSSVariable } from 'uniwind';

export default function TabsLayout() {
  const [background, backgroundElement, foreground] = useCSSVariable([
    '--color-background',
    '--color-background-element',
    '--color-foreground',
  ]) as string[];

  return (
    <NativeTabs
      backgroundColor={background}
      indicatorColor={backgroundElement}
      labelStyle={{ selected: { color: foreground } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }} md="pie_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Label>Add food</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          md="add_circle"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Goals</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'target', selected: 'target' }} md="target" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
