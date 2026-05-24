import React, { createContext, useContext, useRef, useState } from "react";

type RefreshContextType = {
  refreshing: boolean;
  triggerRefresh: () => void;
  register: (fn: () => Promise<void>) => () => void;
};

const RefreshContext = createContext<RefreshContextType>({} as any);

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const handlerRef = useRef<(() => Promise<void>) | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const register = (fn: () => Promise<void>) => {
    handlerRef.current = fn;
    return () => {
      if (handlerRef.current === fn) {
        handlerRef.current = null;
      }
    };
  };

  const triggerRefresh = async () => {
    if (refreshing || !handlerRef.current) return;

    setRefreshing(true);
    try {
      await handlerRef.current();
    } finally {
      setRefreshing(false); // ✅ luôn tắt
    }
  };

  return (
    <RefreshContext.Provider value={{ refreshing, triggerRefresh, register }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
