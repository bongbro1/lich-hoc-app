import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    Platform,
    StatusBar,
    Alert
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAlert } from '../contexts/AlertContext';
import { useLoading } from '../contexts/LoadingContext';
import { Colors } from '../utils/theme';
import { useAuthVM } from 'viewmodels/useAuthVM';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: { navigation: any }) {
    const { showAlert } = useAlert();
    const { showLoading, hideLoading } = useLoading();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Animation values
    const usernameFocused = useRef(new Animated.Value(0)).current;
    const passwordFocused = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const titleScale = useRef(new Animated.Value(0.8)).current;

    const { loadSavedCredentials, login } = useAuthVM();

    useEffect(() => {
        const bootstrap = async () => {
            const creds = await loadSavedCredentials();
            if (creds?.username) {
                setUsername(creds.username);
                usernameFocused.setValue(1);
            }
            if (creds?.password) {
                setPassword(creds.password);
                passwordFocused.setValue(1);
            }
            if (creds?.username && creds?.password) setRememberMe(true);
        };
        bootstrap();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.spring(titleScale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleFocus = (animatedValue: Animated.Value) => {
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = (animatedValue: Animated.Value, value: string) => {
        if (!value) {
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 150,
                useNativeDriver: false,
            }).start();
        }
    };

    const renderFloatingLabel = (label: string, animatedValue: Animated.Value) => {
        return (
            <Animated.Text
                style={{
                    position: 'absolute',
                    left: 15,
                    color: '#94A3B8',
                    fontSize: 14,
                    top: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, -12],
                    }),
                    backgroundColor: 'white',
                    paddingHorizontal: 4,
                    fontWeight: '600',
                    zIndex: 1,
                }}
            >
                {label}
            </Animated.Text>
        );
    };

    const onLogin = async () => {
        // Request permissions on Android when clicking Login to improve app startup UX
        if (Platform.OS === 'android') {
            try {
                await Notifications.requestPermissionsAsync();
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.MAX,
                    sound: 'default',
                    vibrationPattern: [0, 250, 250, 250],
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                });
            } catch (e) {
                console.log('Error requesting notification permissions:', e);
            }
            try {
                await Location.requestForegroundPermissionsAsync();
            } catch (e) {
                console.log('Error requesting location permissions:', e);
            }
        }

        showLoading('Đang đăng nhập...');
        try {
            const result = await login({
                username,
                password,
                rememberMe,
            });

            if (!result.success) {
                showAlert({
                    type: 'error',
                    title: 'Thông báo',
                    message: result.error || 'Đăng nhập thất bại',
                });
            }
        } finally {
            hideLoading();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.primary }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <KeyboardAwareScrollView
                style={styles.keyboardView}
                contentContainerStyle={{ flexGrow: 1 }}
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={100}
            >
                {/* 1. Khoảng trống Spacer ở đầu */}
                <View style={{ height: 50 }} />

                {/* 2. Header Area */}
                <View style={styles.headerArea}>
                    <Animated.View style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        alignItems: 'center'
                    }}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="school" size={50} color="#fff" />
                        </View>
                        <Text style={styles.headerTitle}>Chào mừng bạn!</Text>
                        <Text style={styles.headerSubtitle}>Đăng nhập để xem lịch học</Text>
                    </Animated.View>
                </View>

                {/* 3. Form Container */}
                <View style={styles.formContainer}>
                    <Animated.Text style={[
                        styles.formTitle,
                        { color: Colors.primary, transform: [{ scale: titleScale }] }
                    ]}>
                        ĐĂNG NHẬP
                    </Animated.Text>

                    <View style={styles.inputWrapper}>
                        {renderFloatingLabel('Mã sinh viên', usernameFocused)}
                        <View style={styles.iconBox}>
                            <MaterialIcons name="person-outline" size={20} color={Colors.primary} />
                        </View>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            onFocus={() => handleFocus(usernameFocused)}
                            onBlur={() => handleBlur(usernameFocused, username)}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        {renderFloatingLabel('Mật khẩu', passwordFocused)}
                        <View style={styles.iconBox}>
                            <MaterialIcons name="lock-outline" size={20} color={Colors.primary} />
                        </View>
                        <TextInput
                            style={styles.input}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => handleFocus(passwordFocused)}
                            onBlur={() => handleBlur(passwordFocused, password)}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <MaterialIcons
                                name={showPassword ? 'visibility' : 'visibility-off'}
                                size={20}
                                color="#94A3B8"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsRow}>
                        <TouchableOpacity
                            onPress={() => setRememberMe(!rememberMe)}
                            style={styles.rememberMe}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                                size={22}
                                color={rememberMe ? Colors.primary : '#94A3B8'}
                            />
                            <Text style={[styles.rememberText, rememberMe && { color: Colors.primary }]}>Ghi nhớ mật khẩu</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: Colors.primary }]}
                        onPress={onLogin}
                        activeOpacity={0.8}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <View style={styles.divider} />
                        <Text style={styles.footerText}>
                            Vui lòng sử dụng tài khoản đăng ký tín chỉ
                        </Text>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    headerArea: {
        height: height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: 30,
        paddingTop: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 35,
        letterSpacing: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 25,
        paddingHorizontal: 15,
        height: 56,
        position: 'relative',
    },
    iconBox: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 5,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberText: {
        marginLeft: 8,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    buttonContent: {
        flexDirection: 'row',
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
        marginRight: 8,
    },
    footer: {
        marginTop: 30,
        marginBottom: 20,
        alignItems: 'center',
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 15,
    },
    footerText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 18,
    },
});
