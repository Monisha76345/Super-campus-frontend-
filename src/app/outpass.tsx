import React from 'react';

import { OutpassScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function OutpassRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <OutpassScreen />
    </ScreenContainer>
  );
}
