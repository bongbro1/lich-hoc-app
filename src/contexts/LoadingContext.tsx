
import React, { createContext, useContext, useState } from 'react';

type LoadingContextType = {
  loading: boolean;
  message?: string;
  showLoading: (msg?: string) => void;
  hideLoading: () => void;
  setLoading: (value: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const showLoading = (msg?: string) => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
    setMessage(undefined);
  };

  return (
    <LoadingContext.Provider
      value={{ loading, message, showLoading, hideLoading, setLoading }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }

  return context;
};
