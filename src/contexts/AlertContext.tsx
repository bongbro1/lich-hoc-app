// AlertContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import SweetAlert from "../components/SweetAlert";

export type AlertOptions = {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextType>({
  showAlert: () => { },
});

export const useAlert = () => useContext(AlertContext);


export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({});

  const showAlert = (opts: AlertOptions) => {
    setOptions({
      confirmText: "OK",
      type: "info",
      title: "Thông báo",
      ...opts,
      onConfirm: () => {
        opts.onConfirm?.();
        setVisible(false);
      },
      onCancel: (opts.onCancel || opts.cancelText)
        ? () => {
          opts.onCancel?.();
          setVisible(false);
        }
        : undefined,
    });
    setVisible(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <SweetAlert visible={visible} {...options} />
    </AlertContext.Provider>
  );
}
