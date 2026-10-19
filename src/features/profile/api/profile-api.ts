import { File, UploadType } from 'expo-file-system';

import { apiRequest } from '@/lib/api/api-client';
import { publicEnv } from '@/lib/config/public-env';

import { CampusProfile, EducationInput, ExperienceInput, ProfileUpdate } from '../types';

interface SessionAuth {
  token: string;
  tenantId: string;
}

function authHeaders(auth: SessionAuth): { token: string; tenantId: string } {
  return { token: auth.token, tenantId: auth.tenantId };
}

export function profilePhotoUri(photoKey: string | null): string | null {
  if (!photoKey) {
    return null;
  }
  return `${publicEnv.apiUrl}/document-uploader/preview?key=${encodeURIComponent(photoKey)}`;
}

export const profileApi = {
  getMine(auth: SessionAuth): Promise<CampusProfile> {
    return apiRequest<CampusProfile>('/profile', { ...authHeaders(auth) });
  },

  updateMine(auth: SessionAuth, body: ProfileUpdate): Promise<CampusProfile> {
    return apiRequest<CampusProfile>('/profile', { method: 'PATCH', ...authHeaders(auth), body });
  },

  addEducation(auth: SessionAuth, body: EducationInput): Promise<CampusProfile> {
    return apiRequest<CampusProfile>('/profile/education', { method: 'POST', ...authHeaders(auth), body });
  },

  updateEducation(auth: SessionAuth, itemId: string, body: EducationInput): Promise<CampusProfile> {
    return apiRequest<CampusProfile>(`/profile/education/${itemId}`, { method: 'PATCH', ...authHeaders(auth), body });
  },

  removeEducation(auth: SessionAuth, itemId: string): Promise<CampusProfile> {
    return apiRequest<CampusProfile>(`/profile/education/${itemId}`, { method: 'DELETE', ...authHeaders(auth) });
  },

  addExperience(auth: SessionAuth, body: ExperienceInput): Promise<CampusProfile> {
    return apiRequest<CampusProfile>('/profile/experience', { method: 'POST', ...authHeaders(auth), body });
  },

  updateExperience(auth: SessionAuth, itemId: string, body: ExperienceInput): Promise<CampusProfile> {
    return apiRequest<CampusProfile>(`/profile/experience/${itemId}`, { method: 'PATCH', ...authHeaders(auth), body });
  },

  removeExperience(auth: SessionAuth, itemId: string): Promise<CampusProfile> {
    return apiRequest<CampusProfile>(`/profile/experience/${itemId}`, { method: 'DELETE', ...authHeaders(auth) });
  },

  addSkill(auth: SessionAuth, name: string): Promise<CampusProfile> {
    return apiRequest<CampusProfile>('/profile/skills', { method: 'POST', ...authHeaders(auth), body: { name } });
  },

  removeSkill(auth: SessionAuth, itemId: string): Promise<CampusProfile> {
    return apiRequest<CampusProfile>(`/profile/skills/${itemId}`, { method: 'DELETE', ...authHeaders(auth) });
  },

  async uploadPhoto(auth: SessionAuth, uri: string, mimeType?: string | null): Promise<CampusProfile> {
    const result = await new File(uri).upload(`${publicEnv.apiUrl}/profile/photo`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType: mimeType || 'image/jpeg',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
        'X-Tenant-Id': auth.tenantId,
      },
    });
    let payload: { success?: boolean; message?: string | string[]; data?: CampusProfile } = {};
    try {
      payload = JSON.parse(result.body) as typeof payload;
    } catch {
      throw new Error('Photo upload failed');
    }
    if (result.status >= 400 || payload.success === false || !payload.data) {
      const message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
      throw new Error(message || 'Photo upload failed');
    }
    return payload.data;
  },
};
