import React from 'react';

import { FoodScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function FoodRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <FoodScreen />
    </ScreenContainer>
  );
}
