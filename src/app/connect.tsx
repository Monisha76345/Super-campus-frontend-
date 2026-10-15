import React from 'react';

import { ConnectScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function ConnectRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <ConnectScreen />
    </ScreenContainer>
  );
}
