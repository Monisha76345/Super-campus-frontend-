import React from 'react';

import { MarketplaceScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function MarketplaceRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <MarketplaceScreen />
    </ScreenContainer>
  );
}
