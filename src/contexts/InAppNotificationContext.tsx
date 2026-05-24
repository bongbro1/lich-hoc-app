import React, { createContext, useContext, useState } from 'react';
import { InAppBanner } from '../components/InAppBanner';

type BannerPayload = {
  title: string;
  body: string;
  data?: any;
};

type ContextType = {
  showBanner: (payload: BannerPayload) => void;
};

const InAppNotificationContext = createContext<ContextType | null>(null);

export const InAppNotificationProvider = ({ children }: any) => {
  const [banner, setBanner] = useState<BannerPayload | null>(null);

  const showBanner = (payload: BannerPayload) => {
    setBanner(payload);
    setTimeout(() => setBanner(null), 3000);
  };

  return (
    <InAppNotificationContext.Provider value={{ showBanner }}>
      {children}
      {banner && <InAppBanner {...banner} />}
    </InAppNotificationContext.Provider>
  );
};

export const useInAppNotification = () => {
  const ctx = useContext(InAppNotificationContext);
  if (!ctx) throw new Error('useInAppNotification must be used inside provider');
  return ctx;
};
