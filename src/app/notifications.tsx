import React from 'react';

import { NotificationsScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function NotificationsRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <NotificationsScreen />
    </ScreenContainer>
  );
}
