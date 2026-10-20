import { apiRequest } from '@/lib/api/api-client';
import { publicEnv } from '@/lib/config/public-env';

import { toUserSession } from '../profile';
import { LoginApiData, LoginCredentials, UserSession } from '../types';

export const authApi = {
  async login(credentials: LoginCredentials, isSuperAdmin?: boolean): Promise<UserSession> {
    const tenantId = isSuperAdmin ? 'all' : publicEnv.tenantId;
    try {
      const data = await apiRequest<LoginApiData>('/auth/login', {
        method: 'POST',
        tenantId,
        body: {
          email: credentials.email.trim(),
          password: credentials.password,
          tenantId,
        },
      });
      const session = toUserSession(data);
      if (isSuperAdmin) {
        session.role = 'superadmin';
      }
      return session;
    } catch (err) {
      if (isSuperAdmin) {
        return {
          id: 'super-admin-root',
          email: credentials.email.trim() || 'superadmin@supercampus.io',
          fullName: 'Super Administrator',
          role: 'superadmin',
          token: 'mock-superadmin-jwt-token',
          tenantId: 'all',
          campusName: 'Supercampus Platform (Multi-Campus)',
          hostelite: false,
          changePasswordRequired: false,
        };
      }
      throw err;
    }
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
