import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../utils/theme';
import * as ImagePicker from "expo-image-picker";
import { useAlert } from '../contexts/AlertContext';
import { useImageFullModal } from '../contexts/ImageFullModalContext';
import { useUser } from '../contexts/UserContext';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { UserModel } from 'models/user';
import { userRepo } from 'repositories/userRepo';

type ProfileCardProps = {
    studentName: string;
    studentId: string;
    avatarUri?: string;
    major: string;
    onAvatarUpdated?: (newUri: string) => void;
    onPress?: () => void;
};

export default function ProfileCard({ studentName, studentId, avatarUri, onAvatarUpdated, onPress }: ProfileCardProps) {
    const [localAvatar, setLocalAvatar] = useState(avatarUri);
    const { openModal } = useImageFullModal();
    const { showAlert } = useAlert();
    const { user, setUser, darkMode } = useUser();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            showAlert({
                type: 'info',
                title: 'Quyền bị từ chối',
                message: 'Ứng dụng cần quyền truy cập ảnh.'
            })
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setLocalAvatar(uri);

            try {
                const newAvatarUrl = await userRepo.uploadAvatar(studentId, uri);
                const updatedUser = {
                    ...user,
                    avatar: newAvatarUrl,
                };

                showAlert({
                    type: 'success',
                    title: 'Thông báo',
                    message: 'Cập nhật ảnh thành công'
                })
                onAvatarUpdated?.(newAvatarUrl);

                // ✅ update context
                setUser(prev => {
                    if (!prev) return prev;

                    const updatedUser: UserModel = {
                        ...prev,
                        avatar: newAvatarUrl,
                    };

                    storageService.set({ key: STORAGE_KEYS.USER, value: updatedUser });

                    return updatedUser;
                });


                // ✅ update storage
                await storageService.set({
                    key: STORAGE_KEYS.USER,
                    value: updatedUser,
                });
            } catch (error) {
                showAlert({
                    type: 'info',
                    title: 'Thông báo',
                    message: 'Tải ảnh lên thất bại'
                })
            }
        }
    };

    const theme = {
        card: darkMode ? '#1E293B' : Colors.primary,
        text: darkMode ? '#F8FAFC' : Colors.white,
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.cardContainer, { backgroundColor: theme.card }]}
                activeOpacity={0.8}
                onPress={onPress} // click card
            >
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9} onLongPress={() => {
                    openModal(localAvatar || avatarUri || '', {
                        editableType: 'avatar',
                        onRequestChange: pickImage,
                    })
                }}>
                    <Image
                        source={
                            localAvatar
                                ? { uri: localAvatar }
                                : avatarUri
                                    ? { uri: avatarUri }
                                    : require("../../assets/avatar_default.jpg") // ảnh mặc định
                        }
                        style={[styles.avatar, { borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#007F80' }]}
                    />
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <Text style={[styles.studentName, { color: theme.text }]}>{studentName}</Text>
                    <Text style={[styles.label_info, { color: theme.text }]}>{studentId}</Text>
                </View>
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 20,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 20,
        borderWidth: 2,
    },
    infoContainer: {
        flexDirection: 'column',
    },
    studentName: {
        fontSize: 20,
        fontWeight: '700',
    },
    label_info: {
        fontSize: 16,
        marginTop: 4,
    },
});
