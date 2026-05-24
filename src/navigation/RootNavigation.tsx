import { createNavigationContainerRef } from '@react-navigation/native';

// Tạo ref
export const navigationRef = createNavigationContainerRef<any>();

// Navigate an toàn
export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}
