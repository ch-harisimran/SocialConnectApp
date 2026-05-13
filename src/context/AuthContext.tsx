import React, { createContext, useContext, useEffect } from 'react';
import { AuthUser } from '../services/mockAuth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loadSession,
  login as loginThunk,
  signUp as signUpThunk,
  logout as logoutThunk,
  updateProfile as updateProfileThunk,
} from '../store/slices/authSlice';

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
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const isLoading = useAppSelector(state => state.auth.isLoading);

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  const signUp = async (name: string, email: string, password: string) => {
    const result = await dispatch(signUpThunk({ name, email, password }));
    if (signUpThunk.rejected.match(result)) {
      throw new Error(result.error.message ?? 'Sign up failed.');
    }
  };

  const login = async (email: string, password: string) => {
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.rejected.match(result)) {
      throw new Error(result.error.message ?? 'Login failed.');
    }
  };

  const logout = async () => {
    await dispatch(logoutThunk());
  };

  const updateProfile = async (updates: { name: string; bio: string; avatar: string | null }) => {
    if (!user) throw new Error('Not authenticated.');
    const result = await dispatch(updateProfileThunk({ userId: user.id, updates }));
    if (updateProfileThunk.rejected.match(result)) {
      throw new Error(result.error.message ?? 'Update failed.');
    }
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
