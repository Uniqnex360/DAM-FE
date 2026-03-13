import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: any | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate=useNavigate()
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        
        console.log('Auth validation - Token from localStorage:', token ? 'exists' : 'missing');
        console.log('Auth validation - Email from localStorage:', email ? 'exists' : 'missing');
        
        if (!token || !email) {
          console.log('No token or email found, user not logged in');
          setLoading(false);
          return;
        }

        setUser({ email, token });
        
        api.get('/auth/verify').catch(() => {
          console.log('Token verification failed, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          setUser(null);
          navigate('/login');
        });
        
      } catch (error) {
        console.error('Error in token validation:', error);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [navigate]);

  const signIn = async (email: string, pass: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', pass);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('email',email)
    setUser({ email, token: access_token });
  };

  const signUp = async (email: string, pass: string) => {
    await api.post('/auth/register', {
      email: email,
      password: pass,
      full_name: email.split('@')[0], 
    });
    
    await signIn(email, pass);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email')
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);