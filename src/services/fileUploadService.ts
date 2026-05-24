import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../configs/firebase';
import { imgbbService } from './imgbbService';

export const fileUploadService = {
    /**
     * Tải ảnh lên ImgBB
     */
    async uploadImage(uri: string): Promise<string> {
        try {
            return await imgbbService.uploadImage(uri);
        } catch (error) {
            console.error('Error uploading image to ImgBB:', error);
            throw error;
        }
    },

    /**
     * Tải tệp tin lên Firebase Storage
     */
    async uploadFile(uri: string, fileName: string): Promise<string> {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileRef = ref(storage, `ai_assistant_files/${Date.now()}_${fileName}`);
            await uploadBytes(fileRef, blob);
            return await getDownloadURL(fileRef);
        } catch (error) {
            console.error('Error uploading file to Firebase Storage:', error);
            throw error;
        }
    }
};
