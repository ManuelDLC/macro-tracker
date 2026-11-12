import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';

import { OffNetworkError } from '@/api/openFoodFacts';
import { Button } from '@/components/button';
import { StyledCameraView, StyledSafeAreaView } from '@/components/styled';
import { ThemedText } from '@/components/themed-text';
import { lookupBarcode } from '@/lib/food-lookup';

const CENTER_CLASSES = 'flex-1 items-center justify-center p-6 gap-4 bg-background';
const ROW_CLASSES = 'flex-row items-center gap-2 flex-wrap';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

type ScanState =
  | { kind: 'scanning' }
  | { kind: 'looking-up'; barcode: string }
  | { kind: 'error'; barcode: string; message: string };

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ kind: 'scanning' });
  // Camera callbacks fire many times per second; a ref blocks re-entry before state updates land.
  const busy = useRef(false);

  async function handleLookup(barcode: string) {
    setState({ kind: 'looking-up', barcode });
    try {
      const result = await lookupBarcode(barcode);
      if (result.status === 'found') {
        router.replace({ pathname: '/food/[id]', params: { id: String(result.foodId) } });
      } else {
        router.replace({ pathname: '/food/custom', params: { barcode: result.barcode } });
      }
    } catch (e) {
      const message =
        e instanceof OffNetworkError ? e.message : 'Something went wrong looking up this barcode.';
      setState({ kind: 'error', barcode, message });
    }
  }

  function onBarcodeScanned({ data }: BarcodeScanningResult) {
    if (busy.current || !data) return;
    busy.current = true;
    handleLookup(data);
  }

  function rescan() {
    busy.current = false;
    setState({ kind: 'scanning' });
  }

  if (!permission) {
    return (
      <View className={CENTER_CLASSES}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className={CENTER_CLASSES}>
        <ThemedText type="smallBold" className="text-center">
          Camera access is needed to scan barcodes
        </ThemedText>
        {permission.canAskAgain ? (
          <Button title="Allow camera" onPress={requestPermission} />
        ) : (
          <>
            <ThemedText type="small" className="text-foreground-secondary text-center">
              Camera access was denied. Enable it for Macro Tracker in Settings.
            </ThemedText>
            <Button title="Open Settings" onPress={() => Linking.openSettings()} />
          </>
        )}
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StyledCameraView
        className="absolute inset-0"
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={state.kind === 'scanning' ? onBarcodeScanned : undefined}
      />

      <StyledSafeAreaView className="flex-1 justify-between p-4" pointerEvents="box-none">
        <View className="flex-row justify-end">
          <Button title="Close" variant="secondary" onPress={() => router.back()} />
        </View>

        <View
          className="self-center w-4/5 aspect-[2] border-[3px] border-white/85 rounded-2xl"
          pointerEvents="none"
        />

        <View className="bg-black/70 rounded-2xl p-4 items-center">
          {state.kind === 'scanning' && (
            <ThemedText type="small" className="text-white text-center">
              Point the camera at a product barcode
            </ThemedText>
          )}
          {state.kind === 'looking-up' && (
            <View className={ROW_CLASSES}>
              <ActivityIndicator colorClassName="accent-white" />
              <ThemedText type="small" className="text-white text-center">
                Looking up {state.barcode}…
              </ThemedText>
            </View>
          )}
          {state.kind === 'error' && (
            <View className="gap-4 items-center">
              <ThemedText type="small" className="text-white text-center">
                {state.message}
              </ThemedText>
              <View className={ROW_CLASSES}>
                <Button title="Retry" onPress={() => handleLookup(state.barcode)} />
                <Button title="Scan again" variant="secondary" onPress={rescan} />
                <Button
                  title="Enter manually"
                  variant="secondary"
                  onPress={() =>
                    router.replace({ pathname: '/food/custom', params: { barcode: state.barcode } })
                  }
                />
              </View>
            </View>
          )}
        </View>
      </StyledSafeAreaView>
    </View>
  );
}
