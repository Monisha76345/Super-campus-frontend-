import React from 'react';

import { ScanScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function ScanRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <ScanScreen />
    </ScreenContainer>
  );
}
