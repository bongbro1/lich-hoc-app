import * as Location from 'expo-location';
import axios from 'axios';
import { WEATHER_API } from '../configs/config';

export interface WeatherData {
  latitude: number;
  longitude: number;
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
  };
}

class WeatherService {
  private cachedPosition: Location.LocationObject | null = null;
  private lastPositionAt: number | null = null;

  async getCurrentPosition(): Promise<Location.LocationObject> {
    if (
      this.cachedPosition &&
      this.lastPositionAt &&
      Date.now() - this.lastPositionAt < 300000 // 5 minutes
    ) {
      return this.cachedPosition;
    }

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Quyền truy cập vị trí bị từ chối');
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    this.cachedPosition = current;
    this.lastPositionAt = Date.now();
    return current;
  }

  async fetchWeatherForecast(latitude: number, longitude: number): Promise<any> {
    const response = await axios.get(WEATHER_API.FORECAST, {
      params: {
        latitude,
        longitude,
        current_weather: true,
        daily: 'temperature_2m_max,temperature_2m_min,weathercode',
        hourly: 'temperature_2m,relative_humidity_2m,weathercode',
        forecast_days: 7,
        timezone: 'auto',
      },
    });

    return response.data;
  }

  async fetchAirQualityForecast(latitude: number, longitude: number): Promise<any> {
    const response = await axios.get(WEATHER_API.AIR_QUALITY, {
      params: {
        latitude,
        longitude,
        hourly: 'pm2_5,us_aqi',
        forecast_days: 7,
        timezone: 'auto',
      },
    });

    return response.data;
  }

  async getLocationNameFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const placemarks = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!placemarks || placemarks.length === 0) return "Không xác định";

      const place = placemarks[0];

      const areaLevel2 = this.firstNonEmpty([
        place.subregion, // quận/huyện
        place.city, // city/town
        place.district,
      ]);

      const areaLevel1 = this.firstNonEmpty([
        place.region, // tỉnh/thành
      ]);

      const parts: string[] = [];

      if (this.isMeaningful(areaLevel2)) {
        parts.push(areaLevel2!.trim());
      }

      if (this.isMeaningful(areaLevel1) && !this.equalsIgnoreCase(areaLevel1, areaLevel2)) {
        parts.push(areaLevel1!.trim());
      }

      if (parts.length === 0) {
        const fallback = this.firstNonEmpty([
          place.name,
          place.street,
          place.city,
          place.region,
          place.country,
        ]);

        return fallback ?? "Không xác định";
      }

      return parts.join(", ");
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return "Không xác định";
    }
  }

  private firstNonEmpty(values: (string | null | undefined)[]): string | null {
    for (const value of values) {
      if (value && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  private isMeaningful(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  }

  private equalsIgnoreCase(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
}

// Thêm extension method giả lập cho Array.add nếu cần, hoặc dùng push
// Ở đây tôi dùng push thay cho add của Dart
const service = new WeatherService();
// Fix parts.add to parts.push
export default service;
