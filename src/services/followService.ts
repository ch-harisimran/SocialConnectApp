import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '../config/firebase';

const FOLLOWS_KEY = '@social_connect_follows';
const FOLLOWS_COLLECTION = 'follows';

export interface FollowRecord {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface FollowStats {
  followers: number;
  following: number;
}

const followDocId = (followerId: string, followingId: string): string =>
  `${followerId}_${followingId}`;

const getLocalFollows = async (): Promise<FollowRecord[]> => {
  const raw = await AsyncStorage.getItem(FOLLOWS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalFollows = async (follows: FollowRecord[]): Promise<void> => {
  await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
};

export const followService = {
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }

    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const ref = doc(db, FOLLOWS_COLLECTION, followDocId(followerId, followingId));
      const existing = await getDoc(ref);
      if (existing.exists()) return;

      await setDoc(ref, {
        followerId,
        followingId,
        createdAt: serverTimestamp(),
      });
      return;
    }

    const follows = await getLocalFollows();
    const exists = follows.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
    if (exists) return;

    await saveLocalFollows([
      ...follows,
      { followerId, followingId, createdAt: new Date().toISOString() },
    ]);
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      await deleteDoc(doc(db, FOLLOWS_COLLECTION, followDocId(followerId, followingId)));
      return;
    }

    const follows = await getLocalFollows();
    await saveLocalFollows(
      follows.filter(f => !(f.followerId === followerId && f.followingId === followingId))
    );
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const snap = await getDoc(doc(db, FOLLOWS_COLLECTION, followDocId(followerId, followingId)));
      return snap.exists();
    }

    const follows = await getLocalFollows();
    return follows.some(f => f.followerId === followerId && f.followingId === followingId);
  },

  async getFollowingIds(followerId: string): Promise<string[]> {
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const q = query(collection(db, FOLLOWS_COLLECTION), where('followerId', '==', followerId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data().followingId as string);
    }

    const follows = await getLocalFollows();
    return follows.filter(f => f.followerId === followerId).map(f => f.followingId);
  },

  async getFollowStats(userId: string): Promise<FollowStats> {
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const [followersSnap, followingSnap] = await Promise.all([
        getDocs(query(collection(db, FOLLOWS_COLLECTION), where('followingId', '==', userId))),
        getDocs(query(collection(db, FOLLOWS_COLLECTION), where('followerId', '==', userId))),
      ]);
      return { followers: followersSnap.size, following: followingSnap.size };
    }

    const follows = await getLocalFollows();
    return {
      followers: follows.filter(f => f.followingId === userId).length,
      following: follows.filter(f => f.followerId === userId).length,
    };
  },
};
