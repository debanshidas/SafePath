import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, registerUser, loginUser, logoutUser } from '../services/firebase';
import { syncUser } from '../services/api';
import { initSeedData } from '../services/mockStorage';

const AuthContext = createContext(null);

const LOCAL_USER_KEY = 'safepath_local_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSeedData();

    // Check local session first
    const savedLocalUser = localStorage.getItem(LOCAL_USER_KEY);
    if (savedLocalUser) {
      try {
        const parsed = JSON.parse(savedLocalUser);
        setUser(parsed);
        setLoading(false);
      } catch {
        localStorage.removeItem(LOCAL_USER_KEY);
      }
    }

    // Also listen to Firebase auth changes
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userObj = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'SafePath User',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            isDemo: false,
          };
          setUser(userObj);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));

          try {
            await syncUser({
              firebase_uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
            });
          } catch {
            // Non-blocking
          }
        } else if (!localStorage.getItem(LOCAL_USER_KEY)) {
          setUser(null);
        }
        setLoading(false);
      });
    } catch {
      // Firebase might not be configured
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const register = async (email, password, name) => {
    try {
      // Attempt Firebase
      const firebaseUser = await registerUser(email, password, name);
      const userObj = {
        uid: firebaseUser.uid,
        displayName: name || email.split('@')[0],
        email: firebaseUser.email,
        isDemo: false,
      };
      setUser(userObj);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      console.warn('Firebase registration failed or dummy key in use. Falling back to local account:', err);
      // Fallback to local account registration
      const userObj = {
        uid: 'user_' + Date.now(),
        displayName: name || email.split('@')[0],
        email: email,
        isDemo: true,
      };
      setUser(userObj);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
      return userObj;
    }
  };

  const login = async (email, password) => {
    try {
      // Attempt Firebase
      const cred = await loginUser(email, password);
      const userObj = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        isDemo: false,
      };
      setUser(userObj);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      console.warn('Firebase login failed or dummy key in use. Falling back to local account:', err);
      // Fallback to local user
      const userObj = {
        uid: 'user_local_' + Math.random().toString(36).substring(2, 8),
        displayName: email.split('@')[0] || 'SafePath User',
        email: email,
        isDemo: true,
      };
      setUser(userObj);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
      return userObj;
    }
  };

  const demoLogin = () => {
    initSeedData();
    const demoUser = {
      uid: 'demo_priya_sharma',
      displayName: 'Priya Sharma',
      email: 'priya@safepath.app',
      isDemo: true,
    };
    setUser(demoUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
