import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { AppState } from 'react-native';
import { UserModel } from 'models/user';

type UserContextType = {
  user: UserModel | null;
  setUser: React.Dispatch<React.SetStateAction<UserModel | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  toggleDarkMode: (value: boolean) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => { },
  loading: true,
  setLoading: () => { },
  darkMode: false,
  toggleDarkMode: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = async (value: boolean) => {
    setDarkMode(value);
    await storageService.set({ key: STORAGE_KEYS.DARK_MODE, value });
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, setLoading, darkMode, toggleDarkMode }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook tiện lợi
export const useUser = () => useContext(UserContext);

export const useLoadUser = () => {
  const { setUser, setLoading, toggleDarkMode } = useUser();

  useEffect(() => {
    async function loadUser() {
      try {
        const cachedUser = await storageService.get({ key: STORAGE_KEYS.USER });
        if (cachedUser) setUser(cachedUser);

        const cachedDark = await storageService.get({ key: STORAGE_KEYS.DARK_MODE });
        if (cachedDark !== null) {
          // Cần set qua state của provider
          // Tuy nhiên hook này gọi bên trong AppNavigatorInner, 
          // nên nó có thể dùng toggleDarkMode của context
          await toggleDarkMode(!!cachedDark);
        }
      } catch (err) {
        console.error("Failed to load cached user:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);
};
