import storageService, { STORAGE_KEYS } from "../services/storageService";

const DEFAULT_URL = "http://192.168.1.157:5000";

let _API_BASE_URL = DEFAULT_URL;

export const AGORA_APP_ID = "2180e7a7f45c4177af40663a590242d0";

// Dùng hàm này để lấy URL ở mọi nơi trong App
export const getApiBaseUrl = () => _API_BASE_URL;

// Hàm cập nhật API URL động
export const updateApiBaseUrl = (newUrl: string) => {
    if (newUrl) {
        _API_BASE_URL = newUrl;
        console.log("🚀 API_BASE_URL updated to:", _API_BASE_URL);
    }
};

// Hàm khởi tạo lấy URL từ cache hoặc mặc định
export const initConfig = async () => {
    const cachedUrl = await storageService.get({ key: STORAGE_KEYS.API_URL });
    if (cachedUrl) {
        _API_BASE_URL = cachedUrl;
    }
};


export const WEATHER_API = {
    FORECAST: 'https://api.open-meteo.com/v1/forecast',
    AIR_QUALITY: 'https://air-quality-api.open-meteo.com/v1/air-quality',
} as const;
