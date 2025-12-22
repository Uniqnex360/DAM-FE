// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

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

  // Check if user is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You could create a /me endpoint in FastAPI to validate the token here
      // For now, we just assume presence of token means logged in
      setUser({ token }); 
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, pass: string) => {
    // FastAPI OAuth2 expects form-data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI maps 'username' to email
    formData.append('password', pass);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    setUser({ email, token: access_token });
  };

  const signUp = async (email: string, pass: string) => {
    // Register endpoint expects JSON
    await api.post('/auth/register', {
      email: email,
      password: pass,
      full_name: email.split('@')[0], // Optional: Default name from email
    });
    
    // Auto login after sign up
    await signIn(email, pass);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);