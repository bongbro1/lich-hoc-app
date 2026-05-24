import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Skeleton from '../types/Skeleton';
import { useUser } from '../contexts/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function WeatherSkeleton() {
    const { darkMode } = useUser();
    const insets = useSafeAreaInsets();
    
    const theme = {
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        primary: Colors.primary,
        gradient: darkMode ? ['#1E293B', '#0F172A'] : [Colors.primary, '#6366F1'],
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Header Area */}
            <View style={[styles.header, { height: 534 }]}>
                <LinearGradient
                    colors={theme.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}
                >
                    <View style={styles.headerTop}>
                        <Skeleton width={40} height={40} radius={20} style={{ opacity: 0.3 }} />
                        <Skeleton width={120} height={32} radius={16} style={{ opacity: 0.3 }} />
                        <Skeleton width={40} height={40} radius={20} style={{ opacity: 0.3 }} />
                    </View>

                    <View style={styles.weatherMain}>
                        <Skeleton width={120} height={120} radius={60} style={{ opacity: 0.3 }} />
                        <Skeleton width={100} height={80} radius={20} style={{ marginTop: 20, opacity: 0.3 }} />
                        <Skeleton width={180} height={24} radius={12} style={{ marginTop: 10, opacity: 0.3 }} />
                        <Skeleton width={140} height={20} radius={10} style={{ marginTop: 12, opacity: 0.3 }} />
                    </View>

                    <View style={[styles.statsContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={styles.statItem}>
                                <Skeleton width={24} height={24} radius={12} style={{ opacity: 0.3 }} />
                                <Skeleton width={40} height={12} radius={6} style={{ marginTop: 8, opacity: 0.3 }} />
                                <Skeleton width={50} height={14} radius={7} style={{ marginTop: 4, opacity: 0.3 }} />
                            </View>
                        ))}
                    </View>
                </LinearGradient>
            </View>

            {/* Content Area */}
            <View style={styles.contentBody}>
                <View style={styles.sectionHeader}>
                    <Skeleton width={150} height={24} radius={12} />
                </View>

                <View style={[styles.forecastCard, { backgroundColor: theme.card }]}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.forecastItem}>
                            <Skeleton width={30} height={12} radius={6} style={{ marginBottom: 8 }} />
                            <Skeleton width={28} height={28} radius={14} />
                            <Skeleton width={25} height={14} radius={7} style={{ marginTop: 8 }} />
                        </View>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Skeleton width={150} height={24} radius={12} />
                </View>

                <View style={[styles.weeklyCard, { backgroundColor: theme.card }]}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.weeklyItem}>
                            <Skeleton width={80} height={20} radius={10} />
                            <Skeleton width={100} height={20} radius={10} />
                            <Skeleton width={60} height={20} radius={10} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weatherMain: {
        alignItems: 'center',
        marginTop: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderRadius: 16,
        padding: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    contentBody: {
        padding: 24,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    forecastCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 1,
            },
        }),
    },
    forecastItem: {
        alignItems: 'center',
        flex: 1,
    },
    weeklyCard: {
        borderRadius: 20,
        padding: 8,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 1,
            },
        }),
    },
    weeklyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
});
