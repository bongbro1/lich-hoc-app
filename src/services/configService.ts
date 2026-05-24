import { ref, get } from "firebase/database";
import { rtdb } from "../configs/firebase";
import { updateApiBaseUrl } from "../configs/config";
import storageService, { STORAGE_KEYS } from "./storageService";

export const configService = {
    async fetchAndSyncApiConfig() {
        try {
            const configRef = ref(rtdb, "app_config/api");
            const snapshot = await get(configRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const remoteUrl = data.base_url;
                if (remoteUrl) {
                    updateApiBaseUrl(remoteUrl);
                    // Lưu lại cache để dùng lần sau
                    await storageService.set({ key: STORAGE_KEYS.API_URL, value: remoteUrl });
                    return remoteUrl;
                }
            }
            return null;
        } catch (error) {
            console.error("Error fetching API config:", error);
            return null;
        }
    },

    async getAboutConfig() {
        try {
            const configRef = ref(rtdb, "app_config/about");
            const snapshot = await get(configRef);
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error("Error fetching about config:", error);
            return null;
        }
    },

    async getHelpCenterConfig() {
        try {
            const configRef = ref(rtdb, "app_config/help_center");
            const snapshot = await get(configRef);
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error("Error fetching help center config:", error);
            return null;
        }
    }
};
