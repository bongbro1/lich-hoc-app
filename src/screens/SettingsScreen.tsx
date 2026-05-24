import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    StatusBar,
    Platform,
    Animated
} from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { cancelAllNotifications, scheduleThreeDaysNotifications } from '../components/NotificationsManager';
import { Colors } from '../utils/theme';
import { SCREENS } from '../configs/constants';

type SettingsProps = {
    navigation: any;
};

export default function SettingsScreen({ navigation }: SettingsProps) {
    const { user, setUser, darkMode, toggleDarkMode } = useUser();
    const { showAlert } = useAlert();
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Load Notifications
                const cachedNotif = await storageService.get({ key: STORAGE_KEYS.NOTIFICATION_ENABLE });
                if (cachedNotif === null || cachedNotif === undefined) {
                    setNotificationsEnabled(true);
                    await storageService.set({ key: STORAGE_KEYS.NOTIFICATION_ENABLE, value: true });
                } else {
                    setNotificationsEnabled(cachedNotif);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };
        loadSettings();
    }, []);

    const handleLogout = () => {
        showAlert({
            type: 'warning',
            title: 'Đăng xuất',
            message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?',
            confirmText: 'Đăng xuất',
            cancelText: 'Hủy',
            onConfirm: async () => {
                await storageService.remove({ key: STORAGE_KEYS.SCHEDULE });
                await storageService.remove({ key: STORAGE_KEYS.STUDENT_MARKS });
                await storageService.remove({ key: STORAGE_KEYS.USER });
                setUser(null);
            },
        });
    };

    const toggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);

        try {
            await storageService.set({ key: STORAGE_KEYS.NOTIFICATION_ENABLE, value });
            if (value) {
                await scheduleThreeDaysNotifications();
                showAlert({
                    type: 'success',
                    title: 'Đã bật thông báo',
                    message: 'Bạn sẽ nhận được thông báo về lịch học vào lúc 20:00 hàng ngày.'
                });
            } else {
                await cancelAllNotifications();
                showAlert({
                    type: 'info',
                    title: 'Đã tắt thông báo',
                    message: 'Bạn sẽ không nhận được thông báo nhắc nhở lịch học nữa.'
                });
            }
        } catch (error) {
            console.error("Error toggling notifications:", error);
            setNotificationsEnabled(!value); // rollback
        }
    };

    const CustomToggle = ({ value, onToggle, activeColor }: { value: boolean, onToggle: (v: boolean) => void, activeColor: string }) => {
        const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

        useEffect(() => {
            Animated.timing(animatedValue, {
                toValue: value ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }, [value]);

        const translateX = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 22],
        });

        const backgroundColor = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['#E2E8F0', activeColor],
        });

        return (
            <Pressable
                onPress={() => {
                    onToggle(!value);
                }}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            >
                <Animated.View style={[styles.toggleTrack, { backgroundColor }]}>
                    <Animated.View style={[styles.toggleKnob, { transform: [{ translateX }] }]} />
                </Animated.View>
            </Pressable>
        );
    };

    const renderSettingItem = (
        icon: string,
        label: string,
        value: boolean | null,
        onToggle?: (val: boolean) => void,
        onPress?: () => void,
        destructive: boolean = false,
        iconColor: string = Colors.primary,
        theme?: any
    ) => (
        <Pressable
            style={({ pressed }) => [
                styles.settingItem,
                { backgroundColor: pressed && !onToggle ? (darkMode ? '#33415550' : '#F1F5F980') : 'transparent' }
            ]}
            onPress={() => {
                onPress && onPress();
            }}
            disabled={!onPress && onToggle === undefined}
        >
            <View style={[styles.iconBox, { backgroundColor: destructive ? (darkMode ? '#7F1D1D40' : '#FEF2F2') : `${iconColor}20` }]}>
                <MaterialIcons name={icon} size={22} color={destructive ? '#EF4444' : iconColor} />
            </View>
            <Text style={[
                styles.settingLabel,
                { color: destructive ? '#EF4444' : (theme?.text || '#334155') }
            ]}>
                {label}
            </Text>
            {onToggle !== undefined ? (
                <CustomToggle
                    value={value as boolean}
                    onToggle={onToggle}
                    activeColor={iconColor}
                />
            ) : (
                <MaterialIcons name="chevron-right" size={20} color={darkMode ? '#475569' : "#CBD5E1"} />
            )}
        </Pressable>
    );

    const theme = {
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#0F172A',
        textSecondary: darkMode ? '#94A3B8' : '#64748B',
        divider: darkMode ? '#334155' : '#F1F5F9',
        sectionTitle: darkMode ? '#64748B' : '#94A3B8',
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
            <StatusBar
                barStyle={darkMode ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent
            />
            <SimpleHeader title='Cài đặt' showBackButton={false} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* User Profile Card */}
                <Pressable
                    style={({ pressed }) => [
                        styles.profileCard, 
                        { 
                            backgroundColor: theme.card, 
                            borderColor: theme.divider,
                            transform: [{ scale: pressed ? 0.98 : 1 }]
                        }
                    ]}
                    onPress={() => navigation.navigate(SCREENS.DASHBOARD, {
                        screen: SCREENS.PROFILE_FEED,
                        params: { studentId: user?.studentId }
                    })}
                >
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                        <View style={[styles.onlineBadge, { borderColor: theme.card }]} />
                    </View>
                    <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Người dùng'}</Text>
                            <MaterialIcons name="verified" size={18} color="#1D9BF0" style={styles.verifiedIcon} />
                        </View>
                        <Text style={[styles.userMajor, { color: theme.textSecondary }]} numberOfLines={1}>{user?.major || 'Chưa cập nhật ngành học'}</Text>
                        <View style={[styles.idBadge, { backgroundColor: darkMode ? `${Colors.primary}30` : `${Colors.primary}10` }]}>
                            <Text style={styles.userId}>MSV: {user?.studentId}</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={darkMode ? '#475569' : "#CBD5E1"} />
                </Pressable>

                {/* System Section */}
                <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>HỆ THỐNG</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                    {renderSettingItem("notifications", "Thông báo", notificationsEnabled, toggleNotifications, undefined, false, Colors.primary, theme)}
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    {renderSettingItem("dark-mode", "Chế độ tối", darkMode, toggleDarkMode, undefined, false, "#8B5CF6", theme)}
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    {renderSettingItem("language", "Ngôn ngữ", null, undefined, () => { }, false, "#F59E0B", theme)}
                </View>

                {/* Support Section */}
                <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>HỖ TRỢ & THÔNG TIN</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                    {renderSettingItem("help-outline", "Trung tâm trợ giúp", null, undefined, () => navigation.navigate(SCREENS.HELP_CENTER), false, "#10B981", theme)}
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    {renderSettingItem("info-outline", "Về ứng dụng", null, undefined, () => navigation.navigate(SCREENS.ABOUT), false, "#64748B", theme)}
                </View>

                {/* Account Section */}
                <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>TÀI KHOẢN</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                    {renderSettingItem("logout", "Đăng xuất", null, undefined, handleLogout, true, Colors.primary, theme)}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20, // Modern iOS curve
        padding: 16,
        marginTop: 20,
        marginBottom: 25,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1F5F9',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: '700', // Reduced from 900
        letterSpacing: -0.5,
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    userMajor: {
        fontSize: 13,
        marginTop: 2,
        fontWeight: '400', // Reduced from 500
    },
    idBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
    },
    userId: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '600', // Reduced from 800
    },
    sectionTitle: {
        fontSize: 13, // Slightly larger for readability
        fontWeight: '700', // Reduced from 800
        marginLeft: 12,
        marginBottom: 8,
        letterSpacing: 0.5, // Subtle letter spacing
        textTransform: 'uppercase',
    },
    sectionCard: {
        borderRadius: 16,
        marginBottom: 28,
        overflow: 'hidden',
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 4,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    iconBox: {
        width: 36, // Slightly more compact
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        flex: 1,
        fontSize: 16, // Better touch target and readability
        fontWeight: '500', // Reduced from 600
        marginLeft: 14,
    },
    divider: {
        height: 1,
        marginLeft: 66, // Offset to align with text
    },
    toggleTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
            },
            android: {
                elevation: 3,
            },
        }),
    },
});
