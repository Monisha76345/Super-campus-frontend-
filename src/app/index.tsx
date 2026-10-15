import React from 'react';

import { LandingScreenContent } from '@/features/landing';
import { ScreenContainer } from '@/layouts';

/**
 * Supercampus Landing / Welcome Screen (Expo Router Root).
 * Features Obsidian Black & #313491 Royal Indigo Theme,
 * heading "Supercampus", feature overview cards, and direct navigation to Login.
 */
export default function HomeScreen() {
  return (
    <ScreenContainer contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <LandingScreenContent />
    </ScreenContainer>
  );
}
