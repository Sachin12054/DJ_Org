import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  displayName: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async nextUser => {
      setUser(nextUser);

      if (!nextUser) {
        setDisplayName('');
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', nextUser.uid);
        const profileSnap = await getDoc(profileRef);
        const firestoreName = profileSnap.exists() ? (profileSnap.data()?.name as string | undefined) : undefined;
        setDisplayName(firestoreName || nextUser.displayName || '');
      } catch {
        setDisplayName(nextUser.displayName || '');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      displayName,
      loading,
      async login(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async signup(name: string, email: string, password: string) {
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

        await updateProfile(cred.user, { displayName: cleanName });
        await setDoc(
          doc(db, 'users', cred.user.uid),
          {
            name: cleanName,
            email: cleanEmail,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        setDisplayName(cleanName);
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [user, displayName, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
