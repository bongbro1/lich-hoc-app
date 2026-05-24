import { CommonActions } from '@react-navigation/native';
import * as RootNavigation from '../navigation/RootNavigation';

export const createExitToChat = (returnTo: {
  name: string;
  params?: any;
}) => {
  let hasExited = false;

  return () => {
    if (hasExited) return;
    hasExited = true;

    if (!RootNavigation.navigationRef.isReady()) return;

    RootNavigation.navigationRef.navigate("MainApp", {
      screen: "Chats",
      params: {
        screen: returnTo.name,
        params: {
          ...returnTo.params,
          __from: "call", // 🔥 FLAG QUAN TRỌNG
        },
      },
    });
  };
};
