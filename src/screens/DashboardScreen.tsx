import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar,
    Image,
    Pressable,
    Platform,
} from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Calendar,
    GraduationCap,
    UsersThree,
    User,
    Clock,
    Cards,
    Bell,
    CaretRight,
    CloudSun,
} from 'phosphor-react-native';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { SCREENS } from '../configs/constants';
import { MaterialIcons } from '@expo/vector-icons';

type DashboardProps = {
    navigation: any;
};

type MenuItem = {
    label: string;
    screen: string;
    icon: any;
};

export default function DashboardScreen({ navigation }: DashboardProps) {
    const { user, darkMode } = useUser();
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState({ gpa: '—', credits: '—' });

    useEffect(() => {
        const loadStats = async () => {
            const marks = await storageService.get({ key: STORAGE_KEYS.STUDENT_MARKS });
            if (marks && marks.studentInfo) {
                setStats({
                    gpa: marks.studentInfo.dtbTLHS4 || '—',
                    credits: marks.studentInfo.totalCredits || '—',
                });
            }
        };
        loadStats();
    }, []);

    const menuItems: MenuItem[] = [
        { label: "Lịch học", screen: SCREENS.SCHEDULE, icon: Clock },
        { label: "Điểm số", screen: SCREENS.GRADES, icon: GraduationCap },
        { label: "Hồ sơ", screen: SCREENS.PROFILE_FEED, icon: User },
        { label: "Quanh đây", screen: SCREENS.FRIENDS_NEARBY, icon: UsersThree },
        { label: "Bạn bè", screen: SCREENS.FRIENDS, icon: UsersThree },
        { label: "Thời tiết", screen: SCREENS.WEATHER, icon: CloudSun },
    ];

    const theme = {
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F1F5F9' : '#0F172A',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        border: darkMode ? '#334155' : '#E2E8F0',
        headerBg: darkMode ? '#1E293B' : Colors.primary,
        iconBg: darkMode ? '#334155' : '#F1F5F9',
    };

    if (!user) return null;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={[theme.headerBg, theme.headerBg] as any}
                    style={[styles.header, { paddingTop: insets.top + 16 }]}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
                            <Text style={styles.userNameText}>{user.name}</Text>
                        </View>
                        <Pressable 
                            style={({ pressed }) => [styles.notifBtn, pressed && { opacity: 0.7 }]}
                        >
                            <Bell size={24} color="#FFF" weight="fill" />
                            <View style={styles.notifBadge} />
                        </Pressable>
                    </View>
                </LinearGradient>

                <View style={styles.contentBody}>
                    {/* Profile Link Card */}
                    <Pressable
                        onPress={() => navigation.navigate(SCREENS.PROFILE_FEED, { studentId: user.studentId })}
                        style={({ pressed }) => [
                            styles.profileCard,
                            { 
                                backgroundColor: theme.card, 
                                borderColor: theme.border,
                                transform: [{ scale: pressed ? 0.98 : 1 }]
                            }
                        ]}
                    >
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
                                style={styles.avatar}
                            />
                            <View style={[styles.onlineBadge, { borderColor: theme.card }]} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileLinkTitle, { color: theme.text }]}>Trang cá nhân</Text>
                            <Text style={[styles.profileLinkSub, { color: theme.textMuted }]}>Quản lý thông tin & bài viết</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
                    </Pressable>

                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Tiện ích sinh viên</Text>

                    {/* Native Flexbox Layout instead of Math calculation */}
                    <View style={styles.menuGrid}>
                        {menuItems.map((item, index) => (
                            <Pressable
                                key={index}
                                style={({ pressed }) => [
                                    styles.menuCard,
                                    { 
                                        backgroundColor: theme.card, 
                                        borderColor: theme.border,
                                        transform: [{ scale: pressed ? 0.96 : 1 }]
                                    }
                                ]}
                                onPress={() => navigation.navigate(item.screen, item.screen === SCREENS.PROFILE_FEED ? { studentId: user?.studentId } : undefined)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
                                    <item.icon size={26} color={Colors.primary} weight="duotone" />
                                </View>
                                <Text style={[styles.menuLabel, { color: theme.text }]} numberOfLines={1}>{item.label}</Text>
                            </Pressable>
                        ))}
                    </View>
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
        // paddingBottom is dynamic now based on insets
    },
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 20,
        // Refined minimal shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        marginBottom: 4,
    },
    userNameText: {
        fontSize: 22,
        color: '#FFF',
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    notifBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    contentBody: {
        paddingHorizontal: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        // Human-made native shadow
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
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F1F5F9',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
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
    profileLinkTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    profileLinkSub: {
        fontSize: 13,
        fontWeight: '400',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 16,
        marginLeft: 4,
        letterSpacing: -0.3,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12, // Modern React Native Native Flexbox gap
    },
    menuCard: {
        flexBasis: '31%', // Let Flexbox handle the calculation
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.02,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
            },
        }),
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24, // Full circle looks more native than slightly rounded box
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    menuLabel: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
});
