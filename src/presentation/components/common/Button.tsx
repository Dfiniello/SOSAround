// Componente Presentazionale (stateless) — RQ-24: safe zone inferiore
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variante?: 'primario' | 'secondario' | 'pericolo';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variante = 'primario',
  isLoading = false,
  disabled = false,
  style,
}) => {
  const bgColor =
    variante === 'pericolo' ? '#E63946'
    : variante === 'secondario' ? '#fff'
    : '#E63946';
  const textColor = variante === 'secondario' ? '#E63946' : '#fff';
  const borderColor = variante === 'secondario' ? '#E63946' : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderColor, borderWidth: variante === 'secondario' ? 2 : 0 },
        disabled && styles.disabilitato,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.testo, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,        // RQ-24: target tocco ampio (one-hand)
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  testo: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabilitato: {
    opacity: 0.4,
  },
});
