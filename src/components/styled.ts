import { CameraView } from 'expo-camera';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export const StyledCameraView = withUniwind(CameraView);
export const StyledGestureHandlerRootView = withUniwind(GestureHandlerRootView);
export const StyledSafeAreaView = withUniwind(SafeAreaView);
