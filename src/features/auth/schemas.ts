export interface ValidationErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(email: string, password: string): ValidationErrors {
  const errors: ValidationErrors = {};

  const cleanEmail = email.trim();
  const domain = (process.env.EXPO_PUBLIC_EMAIL_DOMAIN || 'nmit.ac.in').trim().toLowerCase();
  if (!cleanEmail) {
    errors.email = 'College email or USN is required';
  } else if (cleanEmail.includes('@')) {
    if (!cleanEmail.toLowerCase().endsWith(`@${domain}`)) {
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
