import React, { useState, useEffect } from 'react';
import iconImg from '../../assets/splash-icon.png';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Dimensions, ActivityIndicator } from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        card_logo: darkMode ? '#1E293B' : Colors.primary,
        text: darkMode ? '#F8FAFC' : '#0F172A',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        border: darkMode ? '#334155' : '#F1F5F9',
        headerGradient: darkMode ? ['#1E293B', '#111827'] : [Colors.primary, Colors.primary],
    };

    const nativeVersion = Application.nativeApplicationVersion || '1.0.0';
    const nativeBuild = Application.nativeBuildVersion || '1';

    const isNewUpdateAvailable = aboutConfig?.buildNumber &&
        parseInt(aboutConfig.buildNumber) > parseInt(nativeBuild);

    const infoItems = [
        { icon: 'person', label: 'Nhà phát triển', value: aboutConfig?.developer || 'Team Dev', color: Colors.primary },
        { icon: 'event', label: 'Ngày phát hành', value: aboutConfig?.releaseDate || '22/04/2024', color: Colors.primary },
        { icon: 'language', label: 'Website', value: aboutConfig?.website || 'studentapp.vn', color: Colors.primary },
    ];

    const socialLinks = [
        { icon: 'facebook', label: 'Facebook', color: Colors.primary, url: aboutConfig?.facebookUrl || 'https://facebook.com' },
        { icon: 'groups', label: 'Cộng đồng', color: Colors.primary, url: aboutConfig?.communityUrl || 'https://community.com' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader title="Về ứng dụng" />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Logo Section */}
                    <View style={styles.logoWrapper}>
                        <View style={[styles.logoCard, { backgroundColor: theme.card_logo }]}>
                            <Image
                                source={iconImg}
                                style={styles.logo}
                            />
                        </View>
                        <Text style={[styles.appName, { color: theme.text }]}>{Application.applicationName || 'Lịch Học App'}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.badge}>
                                <Text style={styles.versionText}>Phiên bản {nativeVersion}</Text>
                            </View>
                            {isNewUpdateAvailable && (
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={[styles.badge, { backgroundColor: '#10B98120', marginLeft: 8 }]}
                                    onPress={() => Linking.openURL(aboutConfig?.updateUrl || 'https://play.google.com/store')}
                                >
                                    <Text style={[styles.versionText, { color: '#10B981' }]}>Có bản mới: {aboutConfig?.version}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Main Info Section */}
                    <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {infoItems.map((item, index) => (
                            <View key={index} style={styles.infoRow}>
                                <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                                    <MaterialIcons name={item.icon} size={20} color={item.color} />
                                </View>
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</Text>
                                    <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
                                </View>
                                {index < infoItems.length - 1 && <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />}
                            </View>
                        ))}
                    </View>

                    {/* Description Card */}
                    <View style={[styles.descCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Sứ mệnh của chúng tôi</Text>
                        <Text style={[styles.description, { color: theme.textMuted }]}>
                            {aboutConfig?.description || "Ứng dụng hỗ trợ sinh viên quản lý lịch học, kết quả học tập và kết nối bạn bè một cách thuận tiện nhất. Chúng tôi cam kết mang lại trải nghiệm số hóa giáo dục tốt nhất cho cộng đồng sinh viên Việt Nam."}
                        </Text>
                    </View>

                    {/* Social Links */}
                    <View style={styles.socialGrid}>
                        {socialLinks.map((link, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.9}
                                style={[styles.socialBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => Linking.openURL(link.url)}
                            >
                                <MaterialIcons name={link.icon} size={24} color={link.color} />
                                <Text style={[styles.socialLabel, { color: theme.text }]}>{link.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>
                            © 2024 Team Dev. Made with ❤️ for Students.
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
        paddingBottom: 80,
    },
    logoWrapper: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    logoCard: {
        width: 100,
        height: 100,
        borderRadius: 24,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        marginBottom: 16,
    },
    logo: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    appName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -1,
        marginVertical: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: `${Colors.primary}15`,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    versionText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '800',
    },
    infoSection: {
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        position: 'relative',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextWrapper: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    rowDivider: {
        position: 'absolute',
        bottom: 0,
        left: 60,
        right: 0,
        height: 1,
        opacity: 0.5,
    },
    descCard: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '400',
    },
    socialGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
        gap: 8,
    },
    socialLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.7,
    },
});
