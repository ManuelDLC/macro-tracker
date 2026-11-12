import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/app-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="settings" options={{ title: 'Goals' }} />
    </Tabs>
  );
}
