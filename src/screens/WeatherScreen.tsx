import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Dimensions, ActivityIndicator, Animated, Modal, FlatList, Image, Linking, Platform, InteractionManager } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft, CloudSun, Wind, Drop, Thermometer, Sun, MapPin, CalendarBlank, CloudRain, CloudFog, CloudLightning, ArrowsClockwise, XCircle, NavigationArrow } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../utils/theme';
import { useWeatherVM } from '../viewmodels/useWeatherVM';
import WeatherSkeleton from '../components/WeatherSkeleton';

const { width } = Dimensions.get('window');

const getWeatherInfo = (code: number) => {
    if (code === 0) return { label: 'Trời quang', icon: Sun, color: '#F59E0B' };
    if (code <= 3) return { label: 'Nhiều mây', icon: CloudSun, color: '#3B82F6' };
    if (code <= 48) return { label: 'Sương mù', icon: CloudFog, color: '#94A3B8' };
    if (code <= 67) return { label: 'Có mưa', icon: CloudRain, color: '#0EA5E9' };
    if (code <= 77) return { label: 'Tuyết rơi', icon: CloudSun, color: '#E2E8F0' };
    if (code <= 82) return { label: 'Mưa rào', icon: CloudRain, color: '#0284C7' };
    if (code <= 99) return { label: 'Có dông', icon: CloudLightning, color: '#6366F1' };
    return { label: 'Nhiều mây', icon: CloudSun, color: '#3B82F6' };
};

const ForecastDetailItem = React.memo(({ time, temp, humidity, code, theme, darkMode }: any) => {
    const t = new Date(time);
    const h = t.getHours();
    const iconInfo = getWeatherInfo(code);
    const Icon = iconInfo.icon;

    return (
        <View style={[styles.detailItem, { borderBottomColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
            <Text style={[styles.detailTime, { color: theme.text }]}>{h}:00</Text>
            <View style={styles.detailMain}>
                <Icon size={24} color={iconInfo.color} weight="duotone" />
                <Text style={[styles.detailCondition, { color: theme.text }]}>{iconInfo.label}</Text>
            </View>
            <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                    <Drop size={14} color="#3B82F6" weight="fill" />
                    <Text style={[styles.detailStatText, { color: theme.textMuted }]}>{humidity}%</Text>
                </View>
                <Text style={[styles.detailTemp, { color: theme.text }]}>{Math.round(temp)}°C</Text>
            </View>
        </View>
    );
});

const ScrollingText = ({ text, style }: any) => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const [textWidth, setTextWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (textWidth > containerWidth && containerWidth > 0) {
            const scrollDistance = textWidth - containerWidth + 20;
            const duration = scrollDistance * 50;

            const animation = Animated.loop(
                Animated.sequence([
                    Animated.delay(1500),
                    Animated.timing(scrollX, {
                        toValue: -scrollDistance,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    Animated.delay(1500),
                    Animated.timing(scrollX, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        } else {
            scrollX.setValue(0);
        }
    }, [textWidth, containerWidth, text]);

    return (
        <View
            style={{ flex: 1, overflow: 'hidden', height: 20, justifyContent: 'center' }}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <View style={{ flexDirection: 'row', width: 2000 }}>
                <Animated.Text
                    onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
                    style={[style, { transform: [{ translateX: scrollX }] }]}
                >
                    {text}
                </Animated.Text>
            </View>
        </View>
    );
};

export default function WeatherScreen({ navigation }: any) {
    const { darkMode } = useUser();
    const insets = useSafeAreaInsets();
    const { loading, weatherData, locationName, loadWeather } = useWeatherVM();
    const [showDetail, setShowDetail] = useState(false);
    const sheetAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const closeSheet = () => {
        Animated.parallel([
            Animated.timing(sheetAnim, {
                toValue: Dimensions.get('window').height,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => setShowDetail(false));
    };

    useEffect(() => {
        if (showDetail) {
            Animated.parallel([
                Animated.timing(sheetAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showDetail]);

    const theme = {
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#1E293B',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        primary: Colors.primary,
        gradient: darkMode ? ['#1E293B', '#0F172A'] : [Colors.primary, '#6366F1'],
    };

    const scrollY = useRef(new Animated.Value(0)).current;
    const HEADER_MAX_HEIGHT = 534;
    const HEADER_MIN_HEIGHT = insets.top + 70;
    const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

    const headerHeight = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: 'clamp',
    });


    const contentOpacity = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE / 2],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const contentTranslateY = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [0, -40],
        extrapolate: 'clamp',
    });

    const forecastScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            loadWeather();
        });
        return () => task.cancel();
    }, []);

    useEffect(() => {
        if (weatherData && !loading) {
            const currentHour = new Date().getHours();
            const itemWidth = 80;
            const itemMargin = 8;
            const scrollOffset = Math.max(0, currentHour * (itemWidth + itemMargin) - (width / 2) + (itemWidth / 2) + 80);

            setTimeout(() => {
                forecastScrollRef.current?.scrollTo({ x: scrollOffset, animated: true });
            }, 600);
        }
    }, [weatherData, loading]);


    const currentTemp = weatherData?.current_weather?.temperature || 0;
    const weatherInfo = getWeatherInfo(weatherData?.current_weather?.weathercode || 0);
    const WeatherIcon = weatherInfo.icon;

    const stats = [
        { label: 'Cảm giác', value: `${Math.round(currentTemp + 2)}°C`, icon: Thermometer, color: '#F43F5E' },
        { label: 'Độ ẩm', value: `${weatherData?.hourly?.relative_humidity_2m?.[0] || 65}%`, icon: Drop, color: '#3B82F6' },
        { label: 'Gió', value: `${weatherData?.current_weather?.windspeed || 0} km/h`, icon: Wind, color: '#10B981' },
        { label: 'Chỉ số UV', value: 'Thấp', icon: Sun, color: '#F59E0B' },
    ];

    const today = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dateStr = `${days[today.getDay()]}, ${today.getDate()} Tháng ${today.getMonth() + 1}`;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {!weatherData ? (
                <WeatherSkeleton />
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Collapsible Animated Header */}
                    <Animated.View
                        style={[
                            styles.headerWrapper,
                            {
                                height: headerHeight,
                                zIndex: 10,
                            }
                        ]}
                        pointerEvents="box-none"
                    >
                        <LinearGradient
                            colors={theme.gradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}
                            pointerEvents="box-none"
                        >
                            {/* Header Top - Always Visible & Pinned */}
                            <View style={styles.headerTop}>
                                <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}>
                                    <CaretLeft size={24} color="#FFF" weight="bold" />
                                </Pressable>
                                <View style={styles.locationBadge}>
                                    <MapPin size={16} color="#FFF" weight="fill" />
                                    <ScrollingText text={locationName} style={styles.locationText} />
                                </View>
                                <Pressable onPress={loadWeather} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <ArrowsClockwise size={20} color="#FFF" weight="bold" />
                                    )}
                                </Pressable>
                            </View>

                            {/* Collapsible Content */}
                            <Animated.View
                                style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }], flex: 1, marginTop: 20 }}
                                pointerEvents="box-none"
                            >
                                <View style={styles.weatherMain}>
                                    <WeatherIcon size={120} color="#FFF" weight="duotone" />
                                    <View style={styles.tempContainer}>
                                        <Text style={styles.tempText}>{Math.round(currentTemp)}</Text>
                                        <Text style={styles.unitText}>°C</Text>
                                    </View>
                                    <Text style={styles.conditionText}>{weatherInfo.label}</Text>

                                    <View style={styles.dateBadge}>
                                        <CalendarBlank size={16} color="rgba(255,255,255,0.8)" weight="bold" />
                                        <Text style={styles.dateText}>{dateStr}</Text>
                                    </View>
                                </View>

                                <View style={styles.statsContainer}>
                                    {stats.map((item, index) => (
                                        <View key={index} style={styles.statItem}>
                                            <View style={styles.statIconBox}>
                                                <item.icon size={24} color="#FFF" weight="duotone" />
                                            </View>
                                            <Text style={styles.statLabel}>{item.label}</Text>
                                            <Text style={styles.statValue}>{item.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Animated.View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Scrollable Body */}
                    <Animated.ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    >
                        {/* Spacer to push content down below the initial expanded header */}
                        <View style={{ height: HEADER_MAX_HEIGHT }} />

                        <View style={styles.contentBody}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Dự báo 24h tới</Text>
                                <Pressable onPress={() => setShowDetail(true)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>Xem chi tiết</Text>
                                </Pressable>
                            </View>

                            <ScrollView
                                ref={forecastScrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={[styles.forecastCard, { backgroundColor: theme.card }]}
                                contentContainerStyle={{ paddingRight: 20 }}
                            >
                                {weatherData?.hourly?.time?.slice(0, 24).map((time: string, idx: number) => {
                                    const t = new Date(time);
                                    const h = t.getHours();
                                    const currentHour = new Date().getHours();
                                    const isSelected = h === currentHour;

                                    const temp = weatherData.hourly.temperature_2m[idx];
                                    const code = weatherData.hourly.weathercode[idx];
                                    const iconInfo = getWeatherInfo(code);
                                    const Icon = iconInfo.icon;

                                    return (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.forecastItem,
                                                isSelected && styles.activeForecast,
                                                isSelected && { backgroundColor: theme.primary + '15' }
                                            ]}
                                        >
                                            <Text style={[styles.forecastTime, { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '400' }]}>
                                                {h === currentHour ? 'Bây giờ' : `${h}:00`}
                                            </Text>
                                            <Icon size={28} color={isSelected ? theme.primary : theme.textMuted} weight="duotone" />
                                            <Text style={[styles.forecastTemp, { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '400' }]}>
                                                {Math.round(temp)}°
                                            </Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>

                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Dự báo 7 ngày tới</Text>
                            </View>

                            <View style={[styles.weeklyCard, { backgroundColor: theme.card }]}>
                                {weatherData?.daily?.time?.map((time: string, idx: number) => {
                                    const date = new Date(time);
                                    const dayName = idx === 0 ? 'Hôm nay' : days[date.getDay()];
                                    const code = weatherData.daily.weathercode[idx];
                                    const iconInfo = getWeatherInfo(code);
                                    const Icon = iconInfo.icon;
                                    const maxTemp = weatherData.daily.temperature_2m_max[idx];
                                    const minTemp = weatherData.daily.temperature_2m_min[idx];

                                    return (
                                        <View key={idx} style={[styles.weeklyItem, idx !== 6 && { borderBottomWidth: 1, borderBottomColor: theme.bg }]}>
                                            <Text style={[styles.weeklyDay, { color: theme.text }]}>{dayName}</Text>
                                            <View style={styles.weeklyIconContainer}>
                                                <Icon size={22} color={iconInfo.color} weight="duotone" />
                                                <Text style={[styles.weeklyCondition, { color: theme.textMuted }]}>{iconInfo.label}</Text>
                                            </View>
                                            <View style={styles.weeklyTempContainer}>
                                                <Text style={[styles.weeklyMaxTemp, { color: theme.text }]}>{Math.round(maxTemp)}°</Text>
                                                <Text style={[styles.weeklyMinTemp, { color: theme.textMuted }]}>{Math.round(minTemp)}°</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            <View style={[styles.infoBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                                <Text style={[styles.infoTitle, { color: theme.primary }]}>💡 Lời khuyên cho bạn</Text>
                                <Text style={[styles.infoText, { color: theme.textMuted }]}>
                                    {currentTemp > 30 ? 'Trời khá nóng, bạn nên uống nhiều nước và tránh ra ngoài vào giờ trưa.' :
                                        currentTemp < 20 && currentTemp !== 0 ? 'Tiết trời se lạnh, hãy khoác thêm áo ấm khi đi học nhé!' :
                                            weatherData ? 'Thời tiết hôm nay rất tuyệt vời cho các hoạt động học tập và vui chơi ngoài trời.' :
                                                'Đang tải dữ liệu thời tiết...'}
                                </Text>
                            </View>
                        </View>
                    </Animated.ScrollView>

                    {/* Custom Animated Detail Sheet */}
                    {showDetail && (
                        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                            <Animated.View
                                style={[styles.modalOverlay, { opacity: backdropOpacity }]}
                                pointerEvents={showDetail ? 'auto' : 'none'}
                            >
                                <Pressable style={{ flex: 1 }} onPress={closeSheet} />
                            </Animated.View>

                            <Animated.View
                                style={[
                                    styles.modalContent,
                                    {
                                        backgroundColor: theme.bg,
                                        transform: [{ translateY: sheetAnim }]
                                    }
                                ]}
                            >
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>Chi tiết 24h tới</Text>
                                    <Pressable onPress={closeSheet} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                                        <XCircle size={32} color={theme.textMuted} weight="fill" />
                                    </Pressable>
                                </View>

                                <FlatList
                                    data={weatherData?.hourly?.time?.slice(0, 24)}
                                    keyExtractor={(_, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    initialNumToRender={10}
                                    renderItem={({ item, index }) => (
                                        <ForecastDetailItem
                                            time={item}
                                            temp={weatherData.hourly.temperature_2m[index]}
                                            humidity={weatherData.hourly.relative_humidity_2m[index]}
                                            code={weatherData.hourly.weathercode[index]}
                                            theme={theme}
                                            darkMode={darkMode}
                                        />
                                    )}
                                    contentContainerStyle={{ paddingBottom: 40 }}
                                />
                            </Animated.View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        maxWidth: width * 0.6,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 6,
    },
    weatherMain: {
        alignItems: 'center',
    },
    tempContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    tempText: {
        fontSize: 80,
        fontWeight: '700',
        color: '#FFF',
        lineHeight: 110,
    },
    unitText: {
        fontSize: 24,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
    },
    conditionText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginTop: -10,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginLeft: 6,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconBox: {
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '700',
        marginTop: 2,
    },
    contentBody: {
        padding: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
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
        width: 80,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginRight: 8,
    },
    activeForecast: {
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    forecastTime: {
        fontSize: 13,
        marginBottom: 8,
    },
    forecastTemp: {
        fontSize: 15,
        marginTop: 8,
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
    weeklyDay: {
        fontSize: 15,
        fontWeight: '600',
        width: 85,
    },
    weeklyIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    weeklyCondition: {
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '500',
        width: 80,
    },
    weeklyTempContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: 70,
    },
    weeklyMaxTemp: {
        fontSize: 16,
        fontWeight: '700',
        width: 35,
        textAlign: 'right',
    },
    weeklyMinTemp: {
        fontSize: 16,
        fontWeight: '500',
        width: 35,
        textAlign: 'right',
    },
    infoBox: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 22,
    },
    windMapCard: {
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    windMapImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    windMapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        padding: 20,
        justifyContent: 'flex-end',
    },
    windInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    windLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginBottom: 4,
    },
    windValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
    },
    windDirectionBox: {
        alignItems: 'flex-end',
    },
    directionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    directionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 8,
    },
    expandMapBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    expandMapText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    mapboxCard: {
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    map: {
        flex: 1,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    mapPlaceholderText: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
        lineHeight: 20,
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerOuter: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 99,
    },
    modalContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 24,
        zIndex: 100,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    detailTime: {
        fontSize: 15,
        fontWeight: '600',
        width: 50,
    },
    detailMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    detailCondition: {
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '500',
    },
    detailStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailStat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    detailStatText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    detailTemp: {
        fontSize: 16,
        fontWeight: '700',
        width: 45,
        textAlign: 'right',
    },
});
