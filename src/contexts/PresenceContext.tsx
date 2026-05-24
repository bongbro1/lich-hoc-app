import React, { createContext, useContext, useEffect } from "react";
import { AppState } from "react-native";
import { useUserVM } from "viewmodels/useUserVM";

type PresenceContextType = {};

const PresenceContext = createContext<PresenceContextType>({});

export const PresenceProvider = ({
  children,
  studentId,
}: {
  children: React.ReactNode;
  studentId: string;
}) => {
  const { updateLastOnline } = useUserVM();

  useEffect(() => {
    if (!studentId) return;

    // 🔹 gọi ngay khi mount
    updateLastOnline(studentId);

    // 🔹 khi app chuyển state
    const handleChange = (state: string) => {
      if (state === "active") {
        updateLastOnline(studentId);
      }
    };

    const sub = AppState.addEventListener("change", handleChange);

    // 🔹 ping mỗi 60s
    const interval = setInterval(() => {
      updateLastOnline(studentId);
    }, 60000);

    return () => {
      sub.remove();
      clearInterval(interval);

      // 🔹 khi app unmount
      updateLastOnline(studentId);
    };
  }, [studentId]);

  return (
    <PresenceContext.Provider value={{}}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);