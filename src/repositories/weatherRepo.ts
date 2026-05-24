import weatherService from '../services/weatherService';

export const weatherRepo = {
  async getCurrentWeather(latitude: number, longitude: number) {
    return weatherService.fetchWeatherForecast(latitude, longitude);
  },

  async getLocationName(latitude: number, longitude: number) {
    return weatherService.getLocationNameFromCoordinates(latitude, longitude);
  },

  async getCurrentPosition() {
    return weatherService.getCurrentPosition();
  }
};
