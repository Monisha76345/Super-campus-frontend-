import { AccountRole, LoginApiData, UserSession } from './types';

const ACCOUNT_ROLES: AccountRole[] = ['student', 'faculty', 'admin', 'alumni'];

const ROLE_LABEL: Record<AccountRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Campus Admin',
  alumni: 'Alumni',
};

export function toUserSession(data: LoginApiData): UserSession {
  const role = data.role?.trim().toLowerCase();
  if (!ACCOUNT_ROLES.includes(role as AccountRole)) {
    throw new Error('This account role is not supported');
  }
  return {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    role: role as AccountRole,
    token: data.token,
    tenantId: data.tenantId,
    campusName: data.campusName,
    hostelite: Boolean(data.hostelite),
    changePasswordRequired: Boolean(data.changePasswordRequired),
  };
}

export function firstName(fullName: string): string {
  const name = fullName.trim().split(/\s+/)[0];
  return name || fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function roleLabel(role: AccountRole): string {
  return ROLE_LABEL[role];
}
