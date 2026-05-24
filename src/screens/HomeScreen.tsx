import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, Image, Animated, Dimensions, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CalendarView from '../components/CalendarView';
import CustomHeader from '../components/CustomHeader';
import { useAlert } from '../contexts/AlertContext';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { getSchedulesForRange } from '../services/scheduleService';
import { DaySchedule } from '../models/schedule';
import { useAsyncAction } from '../hooks/useAsyncAction';
import ScheduleView from '../components/ScheduleView';
import { addDays, normalizeDateLocal } from '../utils/date';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleThreeDaysNotifications } from '../components/NotificationsManager';
import { Colors } from '../utils/theme';
import { useScheduleController } from 'controllers/useScheduleController';
import { useUser } from '../contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREENS } from 'configs/constants';
import { AIAssistant } from 'components/AIAssistant';

export default function HomeScreen({ navigation }: any) {
    const { darkMode } = useUser();
    const { run } = useAsyncAction();
    const [loading, setLoading] = useState(true);
    const {
        selectedDate,
        updateFromCalendar,
        updateFromScroll,
        isFromCalendarRef,
        doneCalendar,
    } = useScheduleController();
    const [user, setUser] = useState<any>({
        domain: '',
        email: '',
        full_name: '',
        password: '',
        student_id: '',
    });
    const { showAlert } = useAlert();
    const [schedulesToRender, setSchedulesToRender] = useState<DaySchedule[]>([]);

    useEffect(() => {
        async function loadUserData() {
            const cachedUser = await storageService.get({ key: STORAGE_KEYS.USER });
            if (cachedUser) {
                setUser(cachedUser);
            }
        }
        loadUserData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            async function syncSchedule() {
                try {
                    const cachedSchedule = await getSchedulesForRange(false);
                    setSchedulesToRender(cachedSchedule);

                    const today = normalizeDateLocal(new Date());
                    await saveNextThreeDaysSchedules(cachedSchedule);
                    updateFromCalendar(today);
                } catch (err) {
                    // Silent fail for auto-sync
                } finally {
                    setLoading(false);
                }
            }

            syncSchedule();
        }, [updateFromCalendar])
    );

    const handleTimetablePress = useCallback(() => {
        navigation.navigate(SCREENS.DASHBOARD, {
            screen: SCREENS.SCHEDULE,
        });
    }, [navigation]);

    const handleRefreshPress = useCallback(async () => {
        setLoading(true);
        try {
            const schedulesToShow = await getSchedulesForRange(true);
            const nextSchedules = schedulesToShow ?? [];
            const today = normalizeDateLocal(new Date());

            setSchedulesToRender(nextSchedules);
            await saveNextThreeDaysSchedules(nextSchedules);
            updateFromCalendar(today);

            showAlert({
                type: 'success',
                title: 'Thông báo',
                message: 'Cập nhật lịch học thành công',
            });
        } catch (err) {
            showAlert({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể cập nhật lịch học. Vui lòng kiểm tra kết nối.',
            });
        } finally {
            setLoading(false);
        }
    }, [showAlert, updateFromCalendar]);

    useEffect(() => {
        const scheduleNotifications = async () => {
            // Delay thêm để không hiện popup xin quyền ngay lập tức
            setTimeout(async () => {
                await scheduleThreeDaysNotifications();
            }, 5000);
        };

        scheduleNotifications();
    }, []);

    if (loading) {
        return <HomeSkeleton />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: darkMode ? '#0F172A' : '#F5F7FB' }}>
            <CustomHeader
                studentName={user.name}
                studentId={user.studentId}
                onTimetablePress={handleTimetablePress}
                onRefreshPress={handleRefreshPress}
            />
            <CalendarView
                selectedDate={selectedDate}
                onDateChange={updateFromCalendar}
                schedules={schedulesToRender}
            />
            <View style={styles.container}>
                {schedulesToRender.length > 0 ? (
                    <ScheduleView
                        schedules={schedulesToRender}
                        selectedDate={selectedDate}
                        onVisibleDateChange={updateFromScroll}
                        isFromCalendarRef={isFromCalendarRef}
                        doneCalendar={doneCalendar}
                    />
                ) : (
                    <Text style={[styles.loadingScheduleText, { color: darkMode ? '#94A3B8' : '#777' }]}>
                        {'Đang tải thêm lịch...'}
                    </Text>
                )}
            </View>
            {/* <AIAssistant /> */}
        </View>
    );
}

export async function saveNextThreeDaysSchedules(allSchedules: DaySchedule[]) {
    const tomorrow = addDays(normalizeDateLocal(new Date()), 1);

    const nextThreeDays = allSchedules.filter(schedule => {
        const date = normalizeDateLocal(new Date(schedule.date));
        return date >= tomorrow && date <= addDays(tomorrow, 2);
    });

    await storageService.set({
        key: STORAGE_KEYS.THREE_DAYS_SCHEDULES,
        value: JSON.stringify(nextThreeDays),
    });
}

const SkeletonBlock = ({ width: propWidth, height, style }: any) => {
    const { darkMode } = useUser();
    const shimmerValue = useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [shimmerValue]);

    const translateX = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-screenWidth, screenWidth],
    });

    return (
        <View
            style={[{
                width: propWidth,
                height,
                backgroundColor: darkMode ? '#334155' : '#E2E8F0',
                overflow: 'hidden',
                borderRadius: height / 2,
            }, style]}
        >
            <Animated.View style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX }] }
            ]}>
                <LinearGradient
                    colors={['transparent', darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const HomeSkeleton = () => {
    const insets = useSafeAreaInsets();
    const { darkMode } = useUser();

    return (
        <View style={{ flex: 1, backgroundColor: darkMode ? '#0F172A' : '#F5F7FB' }}>
            {/* CustomHeader Skeleton */}
            <View style={{
                backgroundColor: darkMode ? '#1E293B' : Colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: insets.top + 8,
                paddingBottom: 25,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                zIndex: 10,
            }}>
                <View>
                    <SkeletonBlock width={140} height={24} style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 }} />
                    <SkeletonBlock width={100} height={16} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <SkeletonBlock width={44} height={44} style={{ borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <SkeletonBlock width={44} height={44} style={{ borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                </View>
            </View>

            {/* CalendarView Skeleton */}
            <View style={{
                backgroundColor: darkMode ? '#1E293B' : '#fff',
                borderRadius: 14,
                padding: 12,
                marginHorizontal: 12,
                marginTop: 12,
                marginBottom: 12,
                elevation: 6,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                borderWidth: darkMode ? 1 : 0,
                borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                            <SkeletonBlock width={30} height={12} style={{ borderRadius: 6 }} />
                        </View>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                            <SkeletonBlock width={34} height={34} style={{ borderRadius: 17 }} />
                        </View>
                    ))}
                </View>
                <SkeletonBlock width={140} height={14} style={{ alignSelf: 'center', marginTop: 14, borderRadius: 7 }} />
            </View>

            {/* ScheduleView Skeleton */}
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
                {[1, 2, 3, 4].map(i => (
                    <View key={i} style={{
                        flexDirection: 'row',
                        backgroundColor: darkMode ? '#1E293B' : '#fff',
                        borderRadius: 14,
                        marginVertical: 6,
                        marginHorizontal: 2,
                        padding: 8,
                        minHeight: 80,
                        elevation: 2,
                        borderWidth: darkMode ? 1 : 0,
                        borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'transparent',
                    }}>
                        <View style={{ width: 50, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                            <SkeletonBlock width={24} height={24} style={{ borderRadius: 12, marginBottom: 4 }} />
                            <SkeletonBlock width={30} height={12} style={{ borderRadius: 4 }} />
                        </View>
                        <View style={{ flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                            <SkeletonBlock width="40%" height={14} style={{ marginBottom: 12, opacity: 0.7 }} />
                            <SkeletonBlock width="80%" height={18} style={{ marginBottom: 10, opacity: 0.9 }} />
                            <SkeletonBlock width="60%" height={12} style={{ opacity: 0.7 }} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: { flex: 1, paddingHorizontal: 10 },
    loadingScheduleText: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#777',
    },
});
