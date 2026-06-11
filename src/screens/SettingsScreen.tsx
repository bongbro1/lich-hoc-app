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
import { MaterialIcons } from '@expo/vector-icons';
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
        const [localValue, setLocalValue] = useState(value);
        const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

        useEffect(() => {
            if (value !== localValue) {
                setLocalValue(value);
                Animated.timing(animatedValue, {
                    toValue: value ? 1 : 0,
                    duration: 180,
                    useNativeDriver: false,
                }).start();
            }
        }, [value]);

        const handlePress = () => {
            const newValue = !localValue;
            setLocalValue(newValue);

            // Chạy animation gạt nút ngay lập tức và chỉ đổi theme sau khi animation đã hoàn tất
            Animated.timing(animatedValue, {
                toValue: newValue ? 1 : 0,
                duration: 150,
                useNativeDriver: false,
            }).start(({ finished }) => {
                if (finished) {
                    onToggle(newValue);
                }
            });
        };

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
                onPress={handlePress}
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
                <MaterialIcons name={icon as any} size={22} color={destructive ? '#EF4444' : iconColor} />
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
        bg: darkMode ? '#0F172A' : '#F5F7FB',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#1E293B',
        textSecondary: Colors.subText,
        divider: darkMode ? '#334155' : '#F1F5F9',
        border: darkMode ? '#334155' : '#E2E8F0',
        accent: Colors.primary,
        subAccent: `${Colors.primary}15`,
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />
            <SimpleHeader title='Cài đặt' showBackButton={false} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* User Profile Area - Following Home Header DNA */}
                <Pressable
                    style={({ pressed }) => [
                        styles.profileArea,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            opacity: pressed ? 0.9 : 1
                        }
                    ]}
                    onPress={() => navigation.navigate(SCREENS.DASHBOARD, {
                        screen: SCREENS.PROFILE_FEED,
                        params: { studentId: user?.studentId }
                    })}
                >
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                        <View style={[styles.onlineIndicator, { borderColor: theme.card }]} />
                    </View>
                    <View style={styles.profileText}>
                        <Text style={[styles.name, { color: theme.text }]}>{user?.name || 'Người dùng'}</Text>
                        <Text style={[styles.major, { color: theme.textSecondary }]}>{user?.major || 'Chưa cập nhật ngành'}</Text>
                        <View style={[styles.studentIdBox, { backgroundColor: theme.subAccent }]}>
                            <Text style={[styles.studentIdText, { color: theme.accent }]}>MSV: {user?.studentId}</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={darkMode ? '#475569' : "#CBD5E1"} />
                </Pressable>

                {/* Settings Sections - Using Flat Grouping */}
                <View style={styles.settingsGroup}>
                    <Text style={[styles.groupTitle, { color: theme.accent }]}>Hệ thống</Text>
                    <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {renderSettingItem("notifications", "Thông báo", notificationsEnabled, toggleNotifications, undefined, false, theme.accent, theme)}
                        <View style={[styles.line, { backgroundColor: theme.divider }]} />
                        {renderSettingItem("dark-mode", "Chế độ tối", darkMode, toggleDarkMode, undefined, false, "#8B5CF6", theme)}
                    </View>
                </View>

                <View style={styles.settingsGroup}>
                    <Text style={[styles.groupTitle, { color: theme.accent }]}>Hỗ trợ & Thông tin</Text>
                    <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {renderSettingItem("help-outline", "Trung tâm trợ giúp", null, undefined, () => navigation.navigate(SCREENS.HELP_CENTER), false, "#10B981", theme)}
                        <View style={[styles.line, { backgroundColor: theme.divider }]} />
                        {renderSettingItem("info-outline", "Về ứng dụng", null, undefined, () => navigation.navigate(SCREENS.ABOUT), false, "#64748B", theme)}
                    </View>
                </View>

                <View style={styles.settingsGroup}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.logoutBtn,
                            {
                                backgroundColor: darkMode ? '#7F1D1D30' : '#FEF2F2',
                                borderColor: darkMode ? '#7F1D1D' : '#FEE2E2',
                                opacity: pressed ? 0.8 : 1
                            }
                        ]}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingBottom: 40,
    },
    profileArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginTop: 16,
        marginBottom: 20,
        borderRadius: 14,
        borderWidth: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
    },
    profileText: {
        flex: 1,
        marginLeft: 14,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
    },
    major: {
        fontSize: 13,
        marginTop: 2,
    },
    studentIdBox: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
    },
    studentIdText: {
        fontSize: 11,
        fontWeight: '800',
    },
    settingsGroup: {
        marginBottom: 20,
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 8,
        marginBottom: 8,
    },
    groupCard: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 12,
    },
    line: {
        height: 1,
        marginHorizontal: 16,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: '700',
        marginLeft: 8,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
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
    },
});
