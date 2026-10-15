import React from 'react';

import { ServicesScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function ServicesRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <ServicesScreen />
    </ScreenContainer>
  );
}
