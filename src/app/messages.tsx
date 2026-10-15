import React from 'react';

import { MessagesScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function MessagesRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <MessagesScreen />
    </ScreenContainer>
  );
}
