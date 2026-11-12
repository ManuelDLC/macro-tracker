import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { OffNetworkError, searchProducts, type OffFood } from '@/api/openFoodFacts';
import { AppIcon } from '@/components/app-icon';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { MacroBits } from '@/components/macro-bits';
import { Segmented } from '@/components/segmented';
import { StyledSafeAreaView } from '@/components/styled';
import { ThemedText } from '@/components/themed-text';
import {
  favoriteFoodsQuery,
  myFoodsQuery,
  recentFoodsQuery,
  upsertFood,
} from '@/db/repo';
import type { Meal } from '@/db/schema';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/cn';
import { scaleMacros, type Macros } from '@/lib/macros';
import { defaultMealForTime, isMeal } from '@/lib/meals';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 400;

const MEAL_OPTIONS = [
  { value: 'breakfast' as const, label: 'Breakfast' },
  { value: 'lunch' as const, label: 'Lunch' },
  { value: 'dinner' as const, label: 'Dinner' },
  { value: 'snack' as const, label: 'Snack' },
];

const FILTERS = [
  { value: 'recent' as const, label: 'Recent' },
  { value: 'favorites' as const, label: 'Favorites' },
  { value: 'mine' as const, label: 'My foods' },
];

type Filter = (typeof FILTERS)[number]['value'];

type ListFood = {
  key: string;
  name: string;
  grams: number;
  macros: Macros;
  onPress: () => void;
};

export default function AddFoodScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ meal?: string }>();
  const initialMeal = isMeal(params.meal) ? params.meal : defaultMealForTime();
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('recent');
  const [opening, setOpening] = useState<string | null>(null);
  const [placeholder] = useCSSVariable(['--color-foreground-secondary']) as string[];

  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const search = useQuery({
    queryKey: ['off-search', debouncedQuery],
    queryFn: ({ signal }) => searchProducts(debouncedQuery, signal),
    enabled: isSearching,
  });
  const { data: recent } = useLiveQuery(recentFoodsQuery());
  const { data: favorites } = useLiveQuery(favoriteFoodsQuery());
  const { data: mine } = useLiveQuery(myFoodsQuery());

  function openFood(id: number) {
    router.push({ pathname: '/food/[id]', params: { id: String(id), meal } });
  }

  async function openOffFood(food: OffFood) {
    setOpening(food.barcode);
    try {
      const id = await upsertFood(food);
      openFood(id);
    } catch (e) {
      Alert.alert('Could not open food', (e as Error).message);
    } finally {
      setOpening(null);
    }
  }

  const rows: ListFood[] = isSearching
    ? (search.data ?? []).map((food) => ({
        key: `off-${food.barcode}`,
        name: food.name,
        grams: 100,
        macros: {
          kcal: food.kcal100,
          protein: food.protein100,
          carbs: food.carbs100,
          fat: food.fat100,
        },
        onPress: () => openOffFood(food),
      }))
    : filter === 'recent'
      ? uniqueByFood(recent).map((food) => ({
          key: `recent-${food.id}`,
          name: food.name,
          grams: food.grams,
          macros: food,
          onPress: () => openFood(food.id),
        }))
      : (filter === 'favorites' ? favorites : mine).map((food) => {
          const grams = food.servingGrams && food.servingGrams > 0 ? food.servingGrams : 100;
          return {
            key: `${filter}-${food.id}`,
            name: food.name,
            grams,
            macros: scaleMacros(food, grams),
            onPress: () => openFood(food.id),
          };
        });

  return (
    <View className="flex-1 bg-background">
      <StyledSafeAreaView edges={['top']} className="flex-1">
        <View className="px-4 pt-2 pb-3 gap-4">
          <View className="flex-row items-center">
            <IconButton ios="xmark" android="close" label="Close" onPress={() => router.back()} />
            <ThemedText type="smallBold" className="flex-1 text-center text-[18px] leading-[24px]">
              Add food
            </ThemedText>
            <View className="w-10" />
          </View>

          <Segmented options={MEAL_OPTIONS} value={meal} onChange={setMeal} variant="accent" />

          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-2xl px-3 bg-background-element">
              <AppIcon ios="magnifyingglass" android="search" size={18} color={placeholder} />
              <TextInput
                placeholder="Search foods"
                placeholderTextColor={placeholder}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                returnKeyType="search"
                className="flex-1 min-h-12 ml-2 text-[16px] text-foreground"
              />
            </View>
            <IconButton
              ios="barcode.viewfinder"
              android="barcode_scanner"
              label="Scan barcode"
              onPress={() => router.push({ pathname: '/scan', params: { meal } })}
            />
          </View>

          {isSearching ? null : (
            <View className="flex-row gap-2">
              {FILTERS.map((item) => {
                const selected = item.value === filter;
                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(item.value)}
                    className={cn(
                      'px-4 py-2 rounded-full',
                      selected ? 'bg-foreground' : 'bg-background-element',
                    )}>
                    <ThemedText
                      type={selected ? 'smallBold' : 'small'}
                      className={selected ? 'text-background' : undefined}>
                      {item.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="px-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View className="rounded-3xl overflow-hidden bg-background-element">
            {rows.length === 0 ? (
              <EmptyState
                isSearching={isSearching}
                pending={search.isPending || debouncedQuery !== query.trim()}
                error={search.error}
                query={debouncedQuery}
                filter={filter}
                onRetry={() => search.refetch()}
                onCreate={() =>
                  router.push({ pathname: '/food/custom', params: { name: debouncedQuery, meal } })
                }
              />
            ) : (
              rows.map((row, index) => (
                <Pressable
                  key={row.key}
                  onPress={row.onPress}
                  disabled={opening !== null}
                  className={cn(
                    'flex-row items-center gap-3 px-4 py-3 active:opacity-60',
                    index > 0 && 'border-t border-background-selected',
                  )}>
                  <View className="flex-1">
                    <ThemedText numberOfLines={1}>{row.name}</ThemedText>
                    <MacroBits macros={row.macros} grams={row.grams} showKcal />
                  </View>
                  {opening && row.key === `off-${opening}` ? (
                    <ActivityIndicator />
                  ) : (
                    <View className="w-8 h-8 rounded-full items-center justify-center bg-background-selected">
                      <AppIcon ios="plus" android="add" size={16} color={placeholder} />
                    </View>
                  )}
                </Pressable>
              ))
            )}
            {isSearching ? null : (
              <Pressable
                onPress={() => router.push({ pathname: '/food/custom', params: { meal } })}
                className="flex-row items-center gap-2 px-4 py-4 border-t border-background-selected active:opacity-60">
                <AppIcon ios="bolt.fill" android="bolt" size={16} color="#2f6fed" />
                <ThemedText type="smallBold" className="text-primary">
                  Quick add calories & macros
                </ThemedText>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </StyledSafeAreaView>
    </View>
  );
}

function uniqueByFood<T extends { id: number }>(rows: readonly T[]): T[] {
  const seen = new Set<number>();
  const unique: T[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    unique.push(row);
    if (unique.length >= 20) break;
  }
  return unique;
}

function EmptyState({
  isSearching,
  pending,
  error,
  query,
  filter,
  onRetry,
  onCreate,
}: {
  isSearching: boolean;
  pending: boolean;
  error: unknown;
  query: string;
  filter: Filter;
  onRetry: () => void;
  onCreate: () => void;
}) {
  if (!isSearching) {
    const message =
      filter === 'favorites'
        ? 'Foods you star show up here.'
        : filter === 'mine'
          ? 'Foods you create show up here.'
          : 'Foods you log show up here.';
    return (
      <ThemedText type="small" className="px-4 py-8 text-center text-foreground-secondary">
        {message}
      </ThemedText>
    );
  }
  if (pending) return <ActivityIndicator className="py-8" />;
  if (error) {
    const msg = error instanceof OffNetworkError ? error.message : 'Search failed. Please try again.';
    return (
      <View className="px-4 py-8 gap-3 items-center">
        <ThemedText type="small" className="text-center text-foreground-secondary">
          {msg}
        </ThemedText>
        <Button title="Retry" variant="secondary" onPress={onRetry} />
      </View>
    );
  }
  return (
    <View className="px-4 py-8 gap-3 items-center">
      <ThemedText type="small" className="text-center text-foreground-secondary">
        No foods with nutrition data matched “{query}”.
      </ThemedText>
      <Button title="Create custom food" variant="secondary" onPress={onCreate} />
    </View>
  );
}
