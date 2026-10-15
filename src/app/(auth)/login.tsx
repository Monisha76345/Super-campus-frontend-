import React from 'react';

import { LoginForm } from '@/features/auth';
import { ScreenContainer } from '@/layouts';

/**
 * Login Screen Route (Expo Router).
 * Follows Tier 2 Thin Screen pattern — wraps the Auth Feature in ScreenContainer.
 */
export default function LoginScreen() {
  return (
    <ScreenContainer>
      <LoginForm />
    </ScreenContainer>
  );
}
