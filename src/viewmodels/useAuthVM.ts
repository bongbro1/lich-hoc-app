import { useCallback, useState } from 'react';
import { useUser } from 'contexts/UserContext';
import storageService, { STORAGE_KEYS } from 'services/storageService';
import { getDomainFromStudentId } from 'utils/getDomain';
import { getPosition } from 'services/locationService';
import { authRepository } from 'repositories/authRepo';
import { userRepo } from 'repositories/userRepo';
import { initPushNotifications } from 'services/notificationService';

type LoginInput = {
    username: string;
    password: string;
    rememberMe: boolean;
};

type LoginResult = {
    success: boolean;
    user?: any;
    data?: any;
    error?: string;
};

import auth from '@react-native-firebase/auth';
import { useLoading } from 'contexts/LoadingContext';

export const useAuthVM = () => {
    const { setUser } = useUser();

    const { showLoading, hideLoading } = useLoading();
    const loadSavedCredentials = useCallback(async () => {
        const credentials = await storageService.get({
            key: STORAGE_KEYS.CREDENTIALS,
        });

        return credentials || null;
    }, []);

    const login = useCallback(
        async ({ username, password, rememberMe }: LoginInput): Promise<LoginResult> => {
            try {
                if (!username.trim() || !password.trim()) {
                    return {
                        success: false,
                        error: 'Vui lòng nhập username và password',
                    };
                }
                showLoading();

                const domain = getDomainFromStudentId(username);

                let lat = 0;
                let lng = 0;

                try {
                    const pos = await getPosition();
                    lat = pos?.lat ?? 0;
                    lng = pos?.lng ?? 0;
                } catch (error) {
                    console.warn('Failed to get position', error);
                }

                // 1. Login qua Flask
                const loginResponse = await authRepository.login({
                    username,
                    password,
                    domain,
                    lat,
                    lng,
                });

                if (!loginResponse.success || !loginResponse.user) {
                    return {
                        success: false,
                        error: loginResponse.error || 'Đăng nhập thất bại',
                    };
                }

                const { user, data } = loginResponse;

                console.log('firebase current user = ', auth().currentUser);

                // 2. Upsert user lên Firebase
                await userRepo.addUserIfNotExists({
                    studentId: user.studentId,
                    name: user.name,
                    className: user.className ?? user.class_name,
                    schoolName: user.schoolName ?? user.school_name,
                    major: user.major,
                    avatar: user.avatar ?? null,
                    lat,
                    lng,
                });

                // 3. Save local
                if (rememberMe) {
                    await storageService.set({
                        key: STORAGE_KEYS.CREDENTIALS,
                        value: { username, password, domain },
                    });
                } else {
                    await storageService.remove?.({ key: STORAGE_KEYS.CREDENTIALS });
                }

                await storageService.set({
                    key: STORAGE_KEYS.USER,
                    value: user,
                });

                await storageService.set({
                    key: STORAGE_KEYS.SCHEDULE,
                    value: JSON.stringify(data),
                });

                // 4. Init push + set global user
                initPushNotifications(user.studentId, () => { });
                setUser(user);

                return {
                    success: true,
                    user,
                    data,
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: error?.message || 'Có lỗi xảy ra khi đăng nhập',
                };
            } finally {
                hideLoading();
            }
        },
        [setUser]
    );

    return {
        loadSavedCredentials,
        login,
    };
};
