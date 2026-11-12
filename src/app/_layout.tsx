import '@/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import migrations from '../../drizzle/migrations';
import { StyledGestureHandlerRootView } from '@/components/styled';
import { ThemedText } from '@/components/themed-text';
import { db } from '@/db/client';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6 gap-2 bg-background">
        <ThemedText type="smallBold">Could not open the database</ThemedText>
        <ThemedText type="small" className="text-foreground-secondary">
          {error.message}
        </ThemedText>
      </View>
    );
  }

  if (!success) return null;

  return (
    <StyledGestureHandlerRootView className="flex-1">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="scan"
              options={{ title: 'Scan barcode', presentation: 'fullScreenModal', headerShown: false }}
            />
            <Stack.Screen name="food/[id]" options={{ title: 'Add food' }} />
            <Stack.Screen name="food/custom" options={{ title: 'Custom food' }} />
            <Stack.Screen
              name="entry/[id]"
              options={{ title: 'Edit entry', presentation: 'modal' }}
            />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </StyledGestureHandlerRootView>
  );
}
