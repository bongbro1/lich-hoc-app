import * as Location from 'expo-location';

export const getPosition = async (): Promise<{ lat: number | null; lng: number | null }> => {
  try {
    // 1. Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission to access location was denied');
      return { lat: null, lng: null };
    }

    // 2. Lấy vị trí hiện tại
    let position = await Location.getLastKnownPositionAsync({});
    if (!position) {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    }

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (err) {
    console.warn('Không lấy được vị trí:', err);
    return { lat: null, lng: null };
  }
};
