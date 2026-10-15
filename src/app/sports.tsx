import React from 'react';

import { SportsScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function SportsRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <SportsScreen />
    </ScreenContainer>
  );
}
