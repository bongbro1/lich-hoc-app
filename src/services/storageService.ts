import AsyncStorage from '@react-native-async-storage/async-storage';

export type Catched_Credentials = {
  username: string;
  password: string;
  domain: string;
};
interface SetParams<T = any> {
  key: keyof typeof STORAGE_KEYS; // chỉ cho phép key trong STORAGE_KEYS
  value: T;
}

export const STORAGE_KEYS = {
  USER: "USER",
  SCHEDULE: "SCHEDULE",
  CREDENTIALS: "CREDENTIALS",
  STUDENT_MARKS: "STUDENT_MARKS",
  THREE_DAYS_SCHEDULES: "THREE_DAYS_SCHEDULES",
  NOTIFICATION_ENABLE: "NOTIFICATION_ENABLE",
  THREE_DAYS_NOTIFICATION_IDS: "THREE_DAYS_NOTIFICATION_IDS",
  DARK_MODE: "DARK_MODE",
  API_URL: "API_URL",
} as const;

const storageService = {
  // Set value theo key, value tự stringify
  set: async ({ key, value }: SetParams) => {
    if (!Object.values(STORAGE_KEYS).includes(key)) {
      console.error(`Invalid key: ${key}`);
      return;
    }
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("Failed to set item:", err);
    }
  },

  // Get value theo key, trả về object/array đã parse
  get: async ({ key }: { key: keyof typeof STORAGE_KEYS }) => {
    if (!Object.values(STORAGE_KEYS).includes(key)) {
      console.error(`Invalid key: ${key}`);
      return null;
    }
    try {
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("Failed to get item:", err);
      return null;
    }
  },

  // Xóa theo key
  remove: async ({ key }: { key: keyof typeof STORAGE_KEYS }) => {
    if (!Object.values(STORAGE_KEYS).includes(key)) {
      console.error(`Invalid key: ${key}`);
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  },

  // Xóa tất cả
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));

    } catch (err) {
      console.error("Failed to clear storage:", err);
    }
  }
};

export default storageService;
