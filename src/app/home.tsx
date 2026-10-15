import React from 'react';

import { HomeScreenContent } from '@/features/home';
import { ScreenContainer } from '@/layouts';

/**
 * SuperCampus Home Dashboard Route (Expo Router).
 * Follows Tier 2 Thin Screen pattern — renders HomeScreenContent inside ScreenContainer.
 */
export default function HomeRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <HomeScreenContent />
    </ScreenContainer>
  );
}
