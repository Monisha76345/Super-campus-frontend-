import { useState } from 'react';

import { authApi } from '../api/authApi';
import { validateLoginForm, ValidationErrors } from '../schemas';
import { useAuthSession } from '../session/AuthSessionProvider';
import { LoginCredentials, UserSession } from '../types';

interface UseLoginReturn {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  errors: ValidationErrors;
  serverError: string | null;
  isLoading: boolean;
  handleSubmit: (
    onSuccess?: (user: UserSession) => void,
    isSuperAdmin?: boolean,
  ) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    onSuccess?: (user: UserSession) => void,
    isSuperAdmin?: boolean,
  ) => {
    setServerError(null);

    const cleanEmail = email.trim().toLowerCase();
    const isSuperAdminAccount =
      Boolean(isSuperAdmin) ||
      cleanEmail.includes('superadmin') ||
      cleanEmail.endsWith('@supercampus.io');

    const formErrors = validateLoginForm(email, password, isSuperAdminAccount);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const credentials: LoginCredentials = { email, password, rememberMe };
      const user = await authApi.login(credentials, isSuperAdminAccount);
      await signIn(user, rememberMe);
      onSuccess?.(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail: (val) => {
      setEmail(val);
      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
    },
    password,
    setPassword: (val) => {
      setPassword(val);
      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
    },
    rememberMe,
    setRememberMe,
    errors,
    serverError,
    isLoading,
    handleSubmit,
  };
}
