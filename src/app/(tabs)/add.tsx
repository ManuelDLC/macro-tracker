import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';

import { OffNetworkError, searchProducts, type OffFood } from '@/api/openFoodFacts';
import { Button } from '@/components/button';
import { MacroLine } from '@/components/macro-line';
import { StyledSafeAreaView } from '@/components/styled';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { recentFoodsQuery, upsertFood } from '@/db/repo';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/cn';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 400;
const EMPTY_CLASSES = 'py-8 items-center gap-4';

type Row = {
  key: string;
  name: string;
  brand: string | null;
  kcal100: number;
  macros?: { kcal: number; protein: number; carbs: number; fat: number };
  onPress: () => void;
};

export default function AddFoodScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const [opening, setOpening] = useState<string | null>(null);

  const search = useQuery({
    queryKey: ['off-search', debouncedQuery],
    queryFn: ({ signal }) => searchProducts(debouncedQuery, signal),
    enabled: isSearching,
  });

  const { data: recent } = useLiveQuery(recentFoodsQuery());

  async function openOffFood(food: OffFood) {
    setOpening(food.barcode);
    try {
      const id = await upsertFood(food);
      router.push({ pathname: '/food/[id]', params: { id: String(id) } });
    } catch (e) {
      Alert.alert('Could not open food', (e as Error).message);
    } finally {
      setOpening(null);
    }
  }

  const rows: Row[] = isSearching
    ? (search.data ?? []).map((f) => ({
        key: `off-${f.barcode}`,
        name: f.name,
        brand: f.brand ?? null,
        kcal100: f.kcal100,
        macros: { kcal: f.kcal100, protein: f.protein100, carbs: f.carbs100, fat: f.fat100 },
        onPress: () => openOffFood(f),
      }))
    : recent.map((f) => ({
        key: `local-${f.id}`,
        name: f.name,
        brand: f.brand,
        kcal100: f.kcal100,
        onPress: () => router.push({ pathname: '/food/[id]', params: { id: String(f.id) } }),
      }));

  function renderEmpty() {
    if (!isSearching) {
      return (
        <ThemedText type="small" className={cn(EMPTY_CLASSES, 'text-foreground-secondary')}>
          Search for a food or scan a barcode. Foods you log will show up here.
        </ThemedText>
      );
    }
    if (search.isPending || debouncedQuery !== query.trim()) {
      return <ActivityIndicator className={EMPTY_CLASSES} />;
    }
    if (search.isError) {
      const msg =
        search.error instanceof OffNetworkError
          ? search.error.message
          : 'Search failed. Please try again.';
      return (
        <View className={EMPTY_CLASSES}>
          <ThemedText type="small" className="text-foreground-secondary text-center">
            {msg}
          </ThemedText>
          <Button title="Retry" variant="secondary" onPress={() => search.refetch()} />
        </View>
      );
    }
    return (
      <View className={EMPTY_CLASSES}>
        <ThemedText type="small" className="text-foreground-secondary text-center">
          No foods with nutrition data matched “{debouncedQuery}”.
        </ThemedText>
        <Button
          title="Create custom food"
          variant="secondary"
          onPress={() => router.push({ pathname: '/food/custom', params: { name: debouncedQuery } })}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StyledSafeAreaView edges={['top']} className="flex-1">
        <View className="px-4 pt-2 pb-2 gap-4">
          <ThemedText type="subtitle">Add food</ThemedText>
          <TextField
            placeholder="Search foods (e.g. banana, greek yogurt)"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <View className="flex-row gap-2">
            <Button title="Scan barcode" className="flex-1" onPress={() => router.push('/scan')} />
            <Button
              title="Custom food"
              variant="secondary"
              className="flex-1"
              onPress={() => router.push('/food/custom')}
            />
          </View>
          <ThemedText type="smallBold" className="text-foreground-secondary">
            {isSearching ? 'Results (per 100 g)' : 'Recent foods'}
          </ThemedText>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="px-4 web:pb-6 ios:pb-[74px] android:pb-[104px]"
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View className="h-hairline bg-background-selected" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={item.onPress}
              disabled={opening !== null}
              className="flex-row items-center gap-2 py-3 active:opacity-60">
              <View className="flex-1">
                <ThemedText numberOfLines={1}>{item.name}</ThemedText>
                {item.macros ? (
                  <MacroLine macros={item.macros} numberOfLines={1} />
                ) : (
                  <ThemedText type="small" className="text-foreground-secondary" numberOfLines={1}>
                    {Math.round(item.kcal100)} kcal / 100 g
                  </ThemedText>
                )}
              </View>
              {item.brand ? (
                <ThemedText
                  type="small"
                  numberOfLines={1}
                  className="text-foreground-secondary max-w-[35%]">
                  {item.brand}
                </ThemedText>
              ) : null}
              {opening && item.key === `off-${opening}` ? <ActivityIndicator /> : null}
            </Pressable>
          )}
        />
      </StyledSafeAreaView>
    </View>
  );
}
