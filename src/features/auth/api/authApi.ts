import { apiRequest } from '@/lib/api/api-client';
import { publicEnv } from '@/lib/config/public-env';

import { toUserSession } from '../profile';
import { LoginApiData, LoginCredentials, UserSession } from '../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<UserSession> {
    const tenantId = publicEnv.tenantId;
    const data = await apiRequest<LoginApiData>('/auth/login', {
      method: 'POST',
      tenantId,
      body: {
        email: credentials.email.trim(),
        password: credentials.password,
        tenantId,
      },
    });
    return toUserSession(data);
  },

  async claimAlumni(usn: string, mobile: string): Promise<void> {
    const tenantId = publicEnv.tenantId;
    await apiRequest('/auth/alumni/claim', {
      method: 'POST',
      tenantId,
      body: { usn: usn.trim(), mobile: mobile.trim(), tenantId },
    });
  },
};
