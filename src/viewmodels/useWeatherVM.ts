import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { weatherRepo } from '../repositories/weatherRepo';

// Module-level cache variables (persist in memory during application runtime)
let cachedWeatherData: any = null;
let cachedLocationName: string = 'Đang tải...';
let lastFetchTime: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache duration

export const useWeatherVM = () => {
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(cachedWeatherData);
  const [locationName, setLocationName] = useState<string>(cachedLocationName);
  const [error, setError] = useState<string | null>(null);

  // Load weather and location cache from AsyncStorage on hook mount
  useEffect(() => {
    const loadCachedData = async () => {
      if (cachedWeatherData) return; // Cache already in memory

      try {
        const savedWeather = await AsyncStorage.getItem('weather_cache_data');
        const savedLocation = await AsyncStorage.getItem('weather_cache_location');
        const savedTime = await AsyncStorage.getItem('weather_cache_time');

        if (savedWeather && savedLocation) {
          const parsedWeather = JSON.parse(savedWeather);
          cachedWeatherData = parsedWeather;
          cachedLocationName = savedLocation;
          if (savedTime) {
            lastFetchTime = parseInt(savedTime, 10);
          }
          setWeatherData(parsedWeather);
          setLocationName(savedLocation);
        }
      } catch (e) {
        console.error('Error loading weather cache:', e);
      }
    };
    loadCachedData();
  }, []);

  const loadWeather = async (force: boolean = false) => {
    const now = Date.now();
    // If the cache is still valid and not a forced reload, skip the API call entirely
    if (!force && cachedWeatherData && (now - lastFetchTime < CACHE_DURATION)) {
      return;
    }

    try {
      // Only show full loading spinner if we don't have any cached data OR if it's a forced reload
      const shouldShowSpinner = !cachedWeatherData || force;
      if (shouldShowSpinner) {
        setLoading(true);
      }
      setError(null);

      const pos = await weatherRepo.getCurrentPosition();
      const { latitude, longitude } = pos.coords;

      const [weather, name] = await Promise.all([
        weatherRepo.getCurrentWeather(latitude, longitude),
        weatherRepo.getLocationName(latitude, longitude)
      ]);

      // Update module cache
      cachedWeatherData = weather;
      cachedLocationName = name;
      lastFetchTime = Date.now();

      // Update state
      setWeatherData(weather);
      setLocationName(name);

      // Persist cache in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('weather_cache_data', JSON.stringify(weather)),
        AsyncStorage.setItem('weather_cache_location', name),
        AsyncStorage.setItem('weather_cache_time', lastFetchTime.toString())
      ]);
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
