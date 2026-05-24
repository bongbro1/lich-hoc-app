import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

// theme.ts
export const Colors = {
  text: "#333",
  gray: "#888",
  light_gray: "#b4b4b4ff",
  white: "#fff",
  orange: "#ff9935",
  primary: "#009899",
  sub_primary: "#00c6c7",
  secondary: "#19b294",
  purple: "#9b58b7",
  primary1: "#009999dc",
  primary2: "#0099996e",

  subText: '#6B7280',
  line: '#E5E7EB',
  bgSoft: '#F8FAFC',
};


export const smoothTransition: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};