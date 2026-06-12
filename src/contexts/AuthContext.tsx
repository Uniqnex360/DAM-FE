import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
interface User {
  email: string;
  token: string;
}
interface ImpersonatedUser {
  email: string;
  full_name?: string;
}
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  impersonationState: {
    isActive: boolean;
    impersonatedUserEmail: string | null;
  };
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
  impersonate: (userId: string, userEmail: string) => Promise<void>;
  stopImpersonation: (onComplete?: () => void) => Promise<void>;
  switchToAnotherUser: (userId: string, userEmail: string) => Promise<void>;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEYS = {
  token: 'token',
  email: 'email',
  role: 'role',
  originalToken: 'originalToken',
  originalEmail: 'originalEmail',
  originalRole: 'originalRole',
  isImpersonating: 'isImpersonating',
  impersonatedEmail: 'impersonatedEmail',
};
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const setAuthData = useCallback((token: string, email: string, role?: string) => {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.email, email);
    if (role) localStorage.setItem(STORAGE_KEYS.role, role);
    setUser({ email, token });
    setUserRole(role || null);
  }, []);
  const clearAuthData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setUser(null);
    setUserRole(null);
    setIsImpersonating(false);
    setImpersonatedUser(null);
  }, []);
  const signIn = useCallback(async (email: string, pass: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', pass);
      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const { access_token } = response.data;
      localStorage.setItem(STORAGE_KEYS.token, access_token);
    localStorage.setItem(STORAGE_KEYS.email, email);
      console.log('Token received:', access_token);
      let role = 'user';
      try {
        const userInfo = await api.get('/auth/verify');
        role = userInfo.data.role || 'user';
      } catch (error) {
        console.error('Failed to get user role:', error);
      }
      setAuthData(access_token, email, role);
      localStorage.removeItem(STORAGE_KEYS.isImpersonating);
      localStorage.removeItem(STORAGE_KEYS.impersonatedEmail);
      setIsImpersonating(false);
      setImpersonatedUser(null);
      toast.success(`Welcome back, ${email}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Login failed');
      throw err;
    }
  }, [setAuthData, navigate]);
  const signUp = useCallback(async (email: string, pass: string) => {
    try {
      await api.post('/auth/register', {
        email: email,
        password: pass,
        full_name: email.split('@')[0],
      });
      await signIn(email, pass);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Registration failed');
      throw err;
    }
  }, [signIn]);
  const impersonate = useCallback(async (userId: string, userEmail: string) => {
    try {
      const currentToken = localStorage.getItem(STORAGE_KEYS.token);
      const currentEmail = localStorage.getItem(STORAGE_KEYS.email);
      const currentRole = localStorage.getItem(STORAGE_KEYS.role);
      if (!isImpersonating) {
        localStorage.setItem(STORAGE_KEYS.originalToken, currentToken || '');
        localStorage.setItem(STORAGE_KEYS.originalEmail, currentEmail || '');
        localStorage.setItem(STORAGE_KEYS.originalRole, currentRole || 'admin');
      }
      const response = await api.post(`/auth/impersonate/${userId}`);
      const { access_token, impersonated_user } = response.data;
      localStorage.setItem(STORAGE_KEYS.token, access_token);
      localStorage.setItem(STORAGE_KEYS.email, userEmail);
      localStorage.setItem(STORAGE_KEYS.role, impersonated_user?.role || 'user');
      localStorage.setItem(STORAGE_KEYS.isImpersonating, 'true');
      localStorage.setItem(STORAGE_KEYS.impersonatedEmail, userEmail);
      setUser({ email: userEmail, token: access_token });
      setUserRole(impersonated_user?.role || 'user');
      setIsImpersonating(true);
      setImpersonatedUser({ email: userEmail, full_name: impersonated_user?.full_name });
      toast.success(`Now impersonating ${userEmail}`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Impersonation failed');
      throw err;
    }
  }, [isImpersonating, navigate]);
  const signOut = useCallback(() => {
    clearAuthData();
    toast.success('Logged out successfully');
    navigate('/login');
  }, [clearAuthData, navigate]);
  const stopImpersonation = useCallback(async (onComplete?: () => void) => {
    try {
      const originalToken = localStorage.getItem(STORAGE_KEYS.originalToken);
      const originalEmail = localStorage.getItem(STORAGE_KEYS.originalEmail);
      const originalRole = localStorage.getItem(STORAGE_KEYS.originalRole);
      if (!originalToken || !originalEmail) {
        signOut();
        return;
      }
      localStorage.setItem(STORAGE_KEYS.token, originalToken);
      localStorage.setItem(STORAGE_KEYS.email, originalEmail);
      localStorage.setItem(STORAGE_KEYS.role, originalRole || 'admin');
      localStorage.removeItem(STORAGE_KEYS.originalToken);
      localStorage.removeItem(STORAGE_KEYS.originalEmail);
      localStorage.removeItem(STORAGE_KEYS.originalRole);
      localStorage.removeItem(STORAGE_KEYS.isImpersonating);
      localStorage.removeItem(STORAGE_KEYS.impersonatedEmail);
      setUser({ email: originalEmail, token: originalToken });
      setUserRole(originalRole || 'admin');
      setIsImpersonating(false);
      setImpersonatedUser(null);
      toast.success('Returned to admin account');
      if (onComplete) {
        onComplete();
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to stop impersonation');
      throw err;
    }
  }, [navigate, signOut]);
  
  const switchToAnotherUser = useCallback(async (userId: string, userEmail: string) => {
    try {
      const response = await api.post(`/auth/impersonate/${userId}`);
      const { access_token, impersonated_user } = response.data;
      localStorage.setItem(STORAGE_KEYS.token, access_token);
      localStorage.setItem(STORAGE_KEYS.email, userEmail);
      localStorage.setItem(STORAGE_KEYS.role, impersonated_user?.role || 'user');
      localStorage.setItem(STORAGE_KEYS.impersonatedEmail, userEmail);
      setUser({ email: userEmail, token: access_token });
      setUserRole(impersonated_user?.role || 'user');
      setImpersonatedUser({ email: userEmail, full_name: impersonated_user?.full_name });
      toast.success(`Switched to ${userEmail}`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Failed to switch user');
      throw err;
    }
  }, [navigate]);
  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.token);
        const email = localStorage.getItem(STORAGE_KEYS.email);
        const role = localStorage.getItem(STORAGE_KEYS.role);
        const impersonating = localStorage.getItem(STORAGE_KEYS.isImpersonating) === 'true';
        const impersonatedEmail = localStorage.getItem(STORAGE_KEYS.impersonatedEmail);
        if (!token || !email) {
          setLoading(false);
          return;
        }
        setUser({ email, token });
        setUserRole(role);
        setIsImpersonating(impersonating);
        if (impersonatedEmail) {
          setImpersonatedUser({ email: impersonatedEmail });
        }
        await api.get('/auth/verify');
      } catch (error) {
        console.error('Token validation failed:', error);
        clearAuthData();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [navigate, clearAuthData]);
  const value = useMemo(() => {
    const impersonationState = {
      isActive: isImpersonating,
      impersonatedUserEmail: impersonatedUser?.email || null,
    };
    return {
      user,
      userRole,
      isImpersonating,
      impersonatedUser,
      impersonationState,
      signIn,
      signUp,
      signOut,
      impersonate,
      stopImpersonation,
      switchToAnotherUser,
      loading,
    };
  }, [user, userRole, isImpersonating, impersonatedUser, signIn, signUp, signOut, impersonate, stopImpersonation, switchToAnotherUser, loading]);
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};