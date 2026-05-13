import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockAuth, AuthUser } from '../services/mockAuth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name: string; bio: string; avatar: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mockAuth.getSession().then(session => {
      setUser(session);
      setIsLoading(false);
    });
  }, []);

  const signUp = async (name: string, email: string, password: string) => {
    const session = await mockAuth.signUp(name, email, password);
    setUser(session);
  };

  const login = async (email: string, password: string) => {
    const session = await mockAuth.login(email, password);
    setUser(session);
  };

  const logout = async () => {
    await mockAuth.logout();
    setUser(null);
  };

  const updateProfile = async (updates: { name: string; bio: string; avatar: string | null }) => {
    if (!user) throw new Error('Not authenticated.');
    const session = await mockAuth.updateProfile(user.id, updates);
    setUser(session);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
