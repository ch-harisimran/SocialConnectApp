import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@social_connect_users';
const SESSION_KEY = '@social_connect_session';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

const getUsers = async (): Promise<User[]> => {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveUsers = async (users: User[]): Promise<void> => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const mockAuth = {
  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    const users = await getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };

    await saveUsers([...users, newUser]);
    const session: AuthUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('No account found with this email address.');
    }
    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    const session: AuthUser = { id: user.id, name: user.name, email: user.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async forgotPassword(email: string): Promise<void> {
    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('No account found with this email address.');
    }
    // Simulate network delay for password reset email
    await new Promise(resolve => setTimeout(resolve, 800));
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};
