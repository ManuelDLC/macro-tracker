import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

type Props = {
  ios: SFSymbol;
  android: AndroidSymbol;
  size?: number;
  color: string;
};

export function AppIcon({ ios, android, size = 22, color }: Props) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
    />
  );
}
