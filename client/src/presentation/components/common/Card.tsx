import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  elevata?: boolean;
}

export const Card: React.FC<Props> = ({ children, style, elevata = false }) => (
  <View style={[styles.card, elevata && styles.elevata, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevata: {
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
});
