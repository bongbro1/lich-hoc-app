import { useState } from 'react';
import { weatherRepo } from '../repositories/weatherRepo';

export const useWeatherVM = () => {
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [locationName, setLocationName] = useState('Đang tải...');
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const pos = await weatherRepo.getCurrentPosition();
      const { latitude, longitude } = pos.coords;

      const [weather, name] = await Promise.all([
        weatherRepo.getCurrentWeather(latitude, longitude),
        weatherRepo.getLocationName(latitude, longitude)
      ]);

      setWeatherData(weather);
      setLocationName(name);
    } catch (e: any) {
      console.error('Error in useWeatherVM:', e);
      setError(e.message || 'Lỗi tải thông tin thời tiết');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    weatherData,
    locationName,
    error,
    loadWeather
  };
};
