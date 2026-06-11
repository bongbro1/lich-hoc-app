import React, { useState, useEffect } from 'react';
import iconImg from '../../assets/splash-icon.png';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Dimensions, ActivityIndicator } from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { configService } from '../services/configService';

const { width } = Dimensions.get('window');


export default function AboutScreen() {
    const { darkMode } = useUser();
    const [loading, setLoading] = useState(true);
    const [aboutConfig, setAboutConfig] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchConfig = async () => {
            const data = await configService.getAboutConfig();
            if (isMounted) {
                if (data) setAboutConfig(data);
                setLoading(false);
            }
        };
        fetchConfig();
        return () => { isMounted = false; };
    }, []);

    const theme = {
        bg: darkMode ? '#0F172A' : '#F5F7FB',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#1E293B',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        border: darkMode ? '#334155' : '#E2E8F0',
        accent: Colors.primary,
        subAccent: `${Colors.primary}15`,
        white: '#FFFFFF',
    };

    const nativeVersion = Application.nativeApplicationVersion || '1.0.0';
    const nativeBuild = Application.nativeBuildVersion || '1';

    const isNewUpdateAvailable = aboutConfig?.buildNumber &&
        parseInt(aboutConfig.buildNumber) > parseInt(nativeBuild);

    const infoItems = [
        { icon: 'person', label: 'Nhà phát triển', value: aboutConfig?.developer || 'Team Dev' },
        { icon: 'event', label: 'Ngày phát hành', value: aboutConfig?.releaseDate || '22/04/2024' },
        { icon: 'language', label: 'Website', value: aboutConfig?.website || 'studentapp.vn' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader title="Về ứng dụng" />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Logo Section - Vibrant Style */}
                    <View style={styles.logoWrapper}>
                        <View style={[styles.logoCard, { backgroundColor: theme.accent }]}>
                            <Image
                                source={iconImg}
                                style={styles.logo}
                            />
                        </View>
                        <Text style={[styles.appName, { color: theme.text }]}>{Application.applicationName || 'Lịch Học App'}</Text>
                        <View style={styles.badgeRow}>
                            <View style={[styles.versionBadge, { backgroundColor: theme.subAccent }]}>
                                <Text style={[styles.versionText, { color: theme.accent }]}>Phiên bản {nativeVersion}</Text>
                            </View>
                            {isNewUpdateAvailable && (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.updateBadge, { backgroundColor: '#10B981' }]}
                                    onPress={() => Linking.openURL(aboutConfig?.updateUrl || 'https://play.google.com')}
                                >
                                    <Text style={styles.updateText}>Có bản mới: {aboutConfig?.version}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Description Card - Solid Color Block (HomeScreen DNA) */}
                    <View style={[styles.missionCard, { backgroundColor: theme.accent }]}>
                        <View style={styles.missionHeader}>
                            <MaterialIcons name="auto-awesome" size={20} color={theme.white} />
                            <Text style={styles.missionTitle}>Sứ mệnh của chúng tôi</Text>
                        </View>
                        <Text style={styles.missionDesc}>
                            {aboutConfig?.description || "Ứng dụng hỗ trợ sinh viên quản lý lịch học, kết quả học tập và kết nối bạn bè một cách thuận tiện nhất. Chúng tôi cam kết mang lại trải nghiệm số hóa giáo dục tốt nhất cho cộng đồng sinh viên Việt Nam."}
                        </Text>
                    </View>

                    {/* Main Info Section - Clean Grid */}
                    <View style={[styles.infoContainer, { backgroundColor: theme.card }]}>
                        {infoItems.map((item, index) => (
                            <View key={index} style={[styles.infoItem, index < infoItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                                <View style={[styles.iconCircle, { backgroundColor: theme.subAccent }]}>
                                    <MaterialIcons name={item.icon as any} size={20} color={theme.accent} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</Text>
                                    <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Social Section */}
                    <View style={styles.socialWrapper}>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => Linking.openURL(aboutConfig?.facebookUrl || 'https://facebook.com')}
                        >
                            <MaterialIcons name="facebook" size={24} color="#1877F2" />
                            <Text style={[styles.socialText, { color: theme.text }]}>Facebook</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => Linking.openURL(aboutConfig?.communityUrl || 'https://community.com')}
                        >
                            <MaterialIcons name="groups" size={24} color={theme.accent} />
                            <Text style={[styles.socialText, { color: theme.text }]}>Cộng đồng</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>
                            © 2024 Team Dev. Crafted with ❤️ for Students.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    logoWrapper: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    logoCard: {
        width: 120,
        height: 120,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    logo: {
        width: 140,
        height: 140,
        resizeMode: 'contain',
    },
    appName: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    versionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '700',
    },
    updateBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    updateText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    missionCard: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        marginBottom: 20,
    },
    missionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    missionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    missionDesc: {
        color: '#FFF',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
        opacity: 0.95,
    },
    infoContainer: {
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 1,
    },
    socialWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    socialText: {
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.5,
    },
});
