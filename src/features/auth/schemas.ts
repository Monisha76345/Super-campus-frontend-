export interface ValidationErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(
  email: string,
  password: string,
  isSuperAdmin?: boolean,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const cleanEmail = email.trim().toLowerCase();
  const domain = (process.env.EXPO_PUBLIC_EMAIL_DOMAIN || 'nmit.ac.in').trim().toLowerCase();

  const isSuperAdminEmail =
    isSuperAdmin ||
    cleanEmail.includes('superadmin') ||
    cleanEmail.endsWith('@supercampus.io') ||
    cleanEmail.endsWith('@supercampus.edu') ||
    cleanEmail === 'dr@supercampus.edu';

  if (!cleanEmail) {
    errors.email = isSuperAdminEmail ? 'Admin email is required' : 'College email or USN is required';
  } else if (isSuperAdminEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Enter a valid admin email address';
    }
  } else if (cleanEmail.includes('@')) {
    if (!cleanEmail.endsWith(`@${domain}`)) {
      errors.email = `Use your college email ending with @${domain}`;
    }
  } else if (!/^[a-zA-Z0-9]{5,32}$/.test(cleanEmail)) {
    errors.email = 'Enter your college email or alumni USN';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}
