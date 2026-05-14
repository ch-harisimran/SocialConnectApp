import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@social_connect_users';
const SESSION_KEY = '@social_connect_session';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  bio: string;
  avatar: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string | null;
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
      bio: '',
      avatar: null,
      createdAt: new Date().toISOString(),
    };

    await saveUsers([...users, newUser]);
    const session: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      bio: newUser.bio,
      avatar: newUser.avatar,
    };
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

    const session: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async updateProfile(
    userId: string,
    updates: { name: string; bio: string; avatar: string | null }
  ): Promise<AuthUser> {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error('User not found.');
    }

    users[index] = { ...users[index], ...updates };
    await saveUsers(users);

    const updated = users[index];
    const session: AuthUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      bio: updated.bio,
      avatar: updated.avatar,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async getPublicProfile(
    userId: string
  ): Promise<{ id: string; name: string; bio: string; avatar: string | null } | null> {
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    return { id: user.id, name: user.name, bio: user.bio, avatar: user.avatar };
  },

  async verifyEmailForReset(email: string): Promise<void> {
    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('No account found with this email address.');
    }
  },

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const users = await getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) {
      throw new Error('No account found with this email address.');
    }
    users[index] = { ...users[index], password: newPassword };
    await saveUsers(users);
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};
