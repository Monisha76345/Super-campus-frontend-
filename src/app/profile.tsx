import React from 'react';

import { ProfileScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function ProfileRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <ProfileScreen />
    </ScreenContainer>
  );
}
