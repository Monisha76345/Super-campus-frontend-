import React from 'react';

import { BuzzScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function BuzzRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <BuzzScreen />
    </ScreenContainer>
  );
}
