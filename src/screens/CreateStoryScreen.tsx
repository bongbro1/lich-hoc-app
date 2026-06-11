import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Image,
    Platform,
    Alert,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../contexts/UserContext';
import { userRepo } from '../repositories/userRepo';
import { imgbbService } from '../services/imgbbService';
import storageService from '../services/storageService';
import * as ImageManipulator from 'expo-image-manipulator';
import SimpleHeader from '../components/SimpleHeader';

const { width: windowWidth } = Dimensions.get('window');

// Exact premium high-resolution nature landscape & portrait photos from user's template
const PLACEHOLDER_GALLERY = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD7zrEgBXyaV-tP-3alrJZHdTOK7uJkaaYDakvgN5v8PjbeDd219I5VlLHrRiFExeAbjelk27KPdRHP_2-dZc05eliuO08-OfLIEogGU9zv7RPSzfk5g7e9-FPOy6qVhQgHnUj3hYqWyvtgdb4d-e9xfOZG6fKakHAmJDh7v84T9WDypIUawNutcA5LRTkeRTOZk5YeMNFMV1drgUdTlNZe2_JxYxP5_0hWsdh9aApqtiXYhgxYv3GElk4dBO0jOydMoqyETI0Z1Tf2',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDqZsBS6H-e1-wo6sQHEHbfpbEOzEEiY5IOo3sQbroMndInPAthpGq2uwVN6gayPUws2kmItnHM7qpy0OEK6bAYYVR948bqYvsCSQU8vKmN5clnKZtHyyYSCGWTlEta0CgCgyvGSs1GfQZUEn-frbH92uHz8I4RL1_VCQOQDNeBlGyvQoUbABDrffLHEMIcZ0hO3kZ7bS2M8RdlDztzvuJTrMfn_eRtqMEIF9ai7AFb3ICCiI-ogSwxLpk-CxZ-K-VvrcH9mzVihi1h',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB1tFZhKo5eYUgSnHy7nFkWTi6m7MhWNJRM_-YlaW2hUwF7kAJLkTgsPIcrljoxl0rlL6MQ2R1X4_4K2sCbKViliRYTG78onZOoClWUuJSOsBPUdGUkB91RtdsD7YlHBBu-YqvgUkzyFzRaiV6hAVfML-_4ODd4xVHrik3mJANP6MSACmdQQst-e6o4SLIj7Iz7PDYys9bkAMjo9YFjWYcOEwATROzOXkamKp40CNm_-YFuEtZVxdiOUt5MhmeOv4WX25HG2owooxPf',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBVYuSMNnZiKEI1eYmCvYz6dzyN5-eD6iM1rydChYt2gu5NQjPO2cKU-SgAGL1aECUQE9vyFxyhG8g01nbJjpFLvC3Rjt47DvMW6PK26hTKmqco_ui5fLmxhRS4P0HLD3DAygecb5XfyWd0FEC5mcxiLrWbLJc6FZ9JYFM862NccHXKJCq78BWu2TndZ1ia_W2Wdxq9yC5KTGLkiq7KjC7AW6r4xbYD1esYXHSITIQMlIZXIffvX-giB4KqTO9WJ5mWShYdLyUy62ef',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC5FLv1JtF0kLi3yzdig0hoAIkxkg-pTaEf07gaQlmgoMtvdhy_OtSyUXen3gb5mvVv8wr5oq-HMVXCeSFj4FBN0IHzCwWwyL_eVo_QOI_pcAGNpfa6UC2sWJcNnVJklPKpIkJZiKcSoIll5eBu7efy1P0b-Jo0Gkan3FyXNUuT_XSxvDCmRaXFYtaA7qwVgXsQXsFOG4eqP6O0JNG5fNpkycaJFXL2bUMYGpnRtxrjuGi9FnlpCD9--Ct_YB_hQDPMI7R8Fz2UGBlJ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCFuLgxzv6CcqLSTRT8BEmnmpQnDZfpvODlu2i2QdbvAIqw5EDECDsurjXs-ePraxcpcXMJBCCAlttcT2vSI7SBXWNBxmX_4OT5vrjCHFx1tLBwFeTTzNDGRfz7Ol0KDht9qpAdCxPxnsqZxYz_Xp6Tk1SzETp9WT9s2vQnbiSSjXeD0vME5DITjnOthE6l8kdt-o-GqHkwlsfwg56f1NEfGn78jG9V17F2cjowevvMHEoM9hxU4PfWlfhbyD7bQy0px9MFlacGaaHM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCdGT3dlOkMxUv_pOIEVBR2W6moDfSSjTF5J4tg5MjdMZakM6kfay6u2kMHw5yfL0eIzrHIFVm0S1QvrEK3ILIg3odMusW0Uw4PJE1BUkjEl7LzHBwluhUXLNqBv0TteSlC4Ji_okjGKXj8NkP0K0nUTgZzGpWaEXz-6vb_E7HQccyAGAa7iVAPo74rBgYf9g5omaNKx6iUr_WCCc9NMQfO-7MzYGbNCFu4_pcgGjRnZyWGaopTEFCOBoSxCcWj4HCNyW-lHuNG-4gf',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCFYDHkPR2L7et1DXl8ocUimRHfA9-zO9jlJ7qRxzMsP1pf7dWvyHoGqegKbTRtvtDAdzMLR4L4GpdwmLWuc0CcrzGB9YfUMlSGKNwjanf1ZVnQYYRjofX8pjFZmntZ7jywbRhMj1RKWR-9lfc6tp-EqK6U80D4FXJNDbw2kbKHi7clYicZ-vlqGv3BJbN682XALXik_IvyLIJSj6pTFWDNofGFc7vAj2LLAkj0H00aHtVeNiOc1XqseO_94DPOUjSE9MHX_sMloQpP'
];

const SELFIE_PLACEHOLDER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY-HShD4Nc-Li5JqB98QIdsxpk_qBwr5SC2GYDE4RUZpTdbOw010X_AtIEK1nFt2x2KE1SN7HPOypzNqmpDYvmgGYWyCLTsaKunik4tnVB7wlZhSwSmjqXJswarcUJyoZH4HwVVUzd3xPpAggTXfGBZwY1ymqHKKpr94OHtDslrC8opOhQoufukdXQWBc_MEiT6ATxxMIu8R-dBamA71rf3H1fJyHXrKuoy4tSrU0uncQsi-AFW-PU2HDroAQu8RdbsfAFFGq9SPhD';

export default function CreateStoryScreen({ navigation }: any) {
    const { user: currentUser } = useUser();
    const { darkMode } = useUser();
    const studentId = currentUser?.studentId;
    const insets = useSafeAreaInsets();

    const theme = useMemo(() => ({
        bg: darkMode ? '#0F172A' : '#FAF8FF',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#191B24',
        textMuted: darkMode ? '#94A3B8' : '#5C5F61',
        border: darkMode ? '#334155' : '#E1E2EE',
        primary: '#0050CD',
        primaryContainer: '#0866FF',
    }), [darkMode]);

    const resizeImage = async (uri: string) => {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 600 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    };

    const handleSelectImageAndUpload = async (localUri: string) => {
        if (!studentId) return;
        try {
            Alert.alert('Thông báo', 'Đang xử lý ảnh và tải lên tin của bạn...');
            const resized = await resizeImage(localUri);
            const fileName = `story_${studentId}_${Date.now()}.jpg`;
            const remoteUrl = await imgbbService.uploadImage(resized, fileName);

            if (!remoteUrl) {
                Alert.alert('Lỗi', 'Không thể tải ảnh lên server. Vui lòng thử lại.');
                return;
            }

            const userProfile = await userRepo.getProfile(studentId);
            const currentStories = userProfile.stories || [];
            const nextStories = [...currentStories, remoteUrl];

            await userRepo.updateProfile(studentId, { stories: nextStories });

            const cached = await storageService.get({ key: "STORIES" }) || {};
            cached[studentId] = nextStories;
            await storageService.set({ key: "STORIES", value: cached });

            Alert.alert('Thành công', 'Đã thêm ảnh vào tin thành công!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error in Create Story Upload:', error);
            Alert.alert('Thất bại', 'Có lỗi xảy ra khi đăng Story.');
        }
    };

    const handleCameraPress = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cấp quyền', 'Ứng dụng cần quyền sử dụng Camera!');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.9,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
            handleSelectImageAndUpload(result.assets[0].uri);
        }
    };

    const handlePickGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cấp quyền', 'Cần quyền truy cập thư viện ảnh!');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.9,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
            handleSelectImageAndUpload(result.assets[0].uri);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader title="Tạo tin" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Bento Grid */}
                <View style={styles.bentoSection}>
                    <View style={styles.grid}>
                        {/* Text Story */}
                        <Pressable
                            style={({ pressed }) => [styles.bentoCard, { opacity: pressed ? 0.9 : 1 }]}
                            onPress={() => Alert.alert('Tính năng', 'Tính năng tạo Tin dạng văn bản đang được phát triển!')}
                        >
                            <LinearGradient
                                colors={['#6200ea', '#d500f9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBg}
                            >
                                <MaterialCommunityIcons name="format-text" size={40} color="#fff" />
                                <Text style={styles.bentoText}>Văn bản</Text>
                            </LinearGradient>
                        </Pressable>

                        {/* Music Story */}
                        <Pressable
                            style={({ pressed }) => [styles.bentoCard, { opacity: pressed ? 0.9 : 1 }]}
                            onPress={() => Alert.alert('Tính năng', 'Tính năng tạo Tin âm nhạc đang được phát triển!')}
                        >
                            <LinearGradient
                                colors={['#ff007a', '#a13400']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBg}
                            >
                                <Ionicons name="musical-notes" size={40} color="#fff" />
                                <Text style={styles.bentoText}>Âm nhạc</Text>
                            </LinearGradient>
                        </Pressable>

                        {/* Green Screen */}
                        <Pressable
                            style={({ pressed }) => [styles.bentoCard, { opacity: pressed ? 0.9 : 1 }]}
                            onPress={handlePickGallery}
                        >
                            <LinearGradient
                                colors={['#00c853', '#00796b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBg}
                            >
                                <MaterialCommunityIcons name="image-filter-frames" size={40} color="#fff" />
                                <Text style={styles.bentoText}>Phông xanh</Text>
                            </LinearGradient>
                        </Pressable>

                        {/* Selfie Camera */}
                        <Pressable
                            style={({ pressed }) => [styles.bentoCard, styles.selfieContainer, { opacity: pressed ? 0.9 : 1 }]}
                            onPress={handleCameraPress}
                        >
                            <Image source={{ uri: SELFIE_PLACEHOLDER }} style={styles.selfieBg} />
                            <View style={styles.glassOverlay}>
                                <Ionicons name="happy" size={40} color={theme.text} />
                                <Text style={[styles.bentoText, { color: theme.text }]}>Selfie</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Gallery Title */}
                <View style={styles.galleryHeader}>
                    <Text style={[styles.galleryTitle, { color: theme.text }]}>Kho ảnh</Text>
                    <Pressable
                        onPress={handlePickGallery}
                        style={styles.dropdownBtn}
                    >
                        <Text style={[styles.dropdownText, { color: theme.primaryContainer }]}>Gần đây</Text>
                        <Ionicons name="chevron-down" size={14} color={theme.primaryContainer} />
                    </Pressable>
                </View>

                {/* Gallery Grid */}
                <View style={styles.galleryGrid}>
                    {/* Camera Tile */}
                    <Pressable
                        style={[styles.galleryTile, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={handleCameraPress}
                    >
                        <Ionicons name="camera" size={32} color={theme.textMuted} style={styles.cameraIcon} />
                        <Text style={[styles.cameraTileText, { color: theme.textMuted }]}>Camera</Text>
                    </Pressable>

                    {/* Highly aesthetic exact visual mockup image tiles */}
                    {PLACEHOLDER_GALLERY.map((uri, idx) => (
                        <Pressable
                            key={idx}
                            style={styles.galleryTile}
                            onPress={() => handleSelectImageAndUpload(uri)}
                        >
                            <Image source={{ uri }} style={styles.galleryImage} />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bentoSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    bentoCard: {
        width: '48.8%',
        aspectRatio: 0.8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientBg: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    selfieContainer: {
        backgroundColor: '#E6E7F4',
        position: 'relative',
    },
    selfieBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.4,
    },
    glassOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    bentoText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginTop: 8,
    },
    galleryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 12,
    },
    galleryTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: '600',
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        paddingHorizontal: 4,
    },
    galleryTile: {
        width: '32.8%',
        aspectRatio: 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        overflow: 'hidden',
    },
    cameraIcon: {
        marginBottom: 4,
    },
    cameraTileText: {
        fontSize: 12,
        fontWeight: '600',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
});
