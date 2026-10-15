import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { useColors } from '@/theme/app-theme';

interface LandingActionsProps {
  onSignIn: () => void;
}

export function LandingActions({ onSignIn }: LandingActionsProps) {
  const Colors = useColors();
  return (
    <View style={styles.container}>
      <Button
        title="Sign In to Portal"
        variant="primary"
        size="lg"
        icon={<Ionicons name="arrow-forward" size={18} color={Colors.text.inverse} />}
        iconPosition="right"
        onPress={onSignIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 24,
  },
});
