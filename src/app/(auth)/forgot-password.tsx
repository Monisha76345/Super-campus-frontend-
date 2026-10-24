import React from 'react';

import { ForgotPasswordForm } from '@/features/auth';
import { ScreenContainer } from '@/layouts';

/**
 * Forgot Password Screen Route (Expo Router).
 * Clean Tier-2 Thin Screen pattern wrapping ForgotPasswordForm in ScreenContainer.
 */
export default function ForgotPasswordScreen() {
  return (
    <ScreenContainer>
      <ForgotPasswordForm />
    </ScreenContainer>
  );
}
