import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions, StackActions } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationsScreen from '../screens/NotificationsScreen';
import GradesScreen from '../screens/GradesScreen';
import { Colors, smoothTransition } from '../utils/theme';
import FriendsNearbyScreen from '../screens/FriendsNearbyScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatStackParamList, DashboardStackParamList, SettingsStackParamList } from './types';
import ProfileFeedScreen from '../screens/ProfileFeedScreen';
import { useUser } from '../contexts/UserContext';
import FriendsScreen from '../screens/FriendsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import AboutScreen from '../screens/AboutScreen';
import WeatherScreen from '../screens/WeatherScreen';
import { useConversationVM } from 'viewmodels/useConversationVM';
import { Conversation } from 'types/chat.types';
import { useNotificationVM } from 'viewmodels/useNotificationVM';
import { SCREENS } from '../configs/constants';

import {
    House,
    SquaresFour,
    ChatCircleDots,
    Bell,
    Gear
} from 'phosphor-react-native';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const tabItems = [
    { name: SCREENS.HOME, label: 'Trang chủ', Icon: House, component: HomeScreen },
    { name: SCREENS.DASHBOARD, label: 'Tiện ích', Icon: SquaresFour, component: DashboardStackScreen },
    { name: SCREENS.CHATS, label: 'Tin nhắn', Icon: ChatCircleDots, component: ChatStackScreen },
    { name: SCREENS.NOTIFICATIONS, label: 'Thông báo', Icon: Bell, component: NotificationsScreen },
    { name: SCREENS.SETTINGS, label: 'Cài đặt', Icon: Gear, component: SettingsStackScreen },
];

function ChatStackScreen() {
    return (
        <ChatStack.Navigator screenOptions={smoothTransition}>
            <ChatStack.Screen name={SCREENS.CHAT_TAB} component={ChatScreen} />
            <ChatStack.Screen name={SCREENS.CHAT_DETAIL} component={ChatDetailScreen} />
        </ChatStack.Navigator>
    );
}

function DashboardStackScreen() {
    return (
        <DashboardStack.Navigator screenOptions={smoothTransition}>
            <DashboardStack.Screen name={SCREENS.DASHBOARD_MAIN} component={DashboardScreen} />
            <DashboardStack.Screen name={SCREENS.SCHEDULE} component={ScheduleScreen} />
            <DashboardStack.Screen name={SCREENS.GRADES} component={GradesScreen} />
            <DashboardStack.Screen name={SCREENS.FRIENDS_NEARBY} component={FriendsNearbyScreen} />
            <DashboardStack.Screen name={SCREENS.PROFILE_FEED} component={ProfileFeedScreen} />
            <DashboardStack.Screen name={SCREENS.FRIENDS} component={FriendsScreen} />
            <DashboardStack.Screen name={SCREENS.WEATHER} component={WeatherScreen} />
        </DashboardStack.Navigator>
    );
}

function SettingsStackScreen() {
    return (
        <SettingsStack.Navigator screenOptions={smoothTransition}>
            <SettingsStack.Screen name={SCREENS.SETTINGS_MAIN} component={SettingsScreen} />
            <SettingsStack.Screen name={SCREENS.HELP_CENTER} component={HelpCenterScreen} />
            <SettingsStack.Screen name={SCREENS.ABOUT} component={AboutScreen} />
        </SettingsStack.Navigator>
    );
}

export default function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName={SCREENS.HOME}
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            {tabItems.map((tab) => (
                <Tab.Screen
                    key={tab.name}
                    name={tab.name}
                    component={tab.component}
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            const state = navigation.getState();
                            const isFocused = state.routes[state.index].name === tab.name;

                            if (isFocused) {
                                // Prevent default pop-to-top handler to avoid the warning on root screen
                                e.preventDefault();

                                const tabRoute = state.routes.find((r: any) => r.name === tab.name);
                                const nestedState = tabRoute?.state;

                                // Only pop to top if there are screens to pop
                                if (nestedState && nestedState.index !== undefined && nestedState.index > 0) {
                                    try {
                                        if (nestedState.key) {
                                            // Route the popToTop action directly to the nested stack navigator using its state key as target
                                            navigation.dispatch({
                                                ...StackActions.popToTop(),
                                                target: nestedState.key,
                                            });
                                        } else {
                                            // Fallback: Navigate directly to the root screen of the stack
                                            let rootScreenName = '';
                                            if (tab.name === SCREENS.DASHBOARD) {
                                                rootScreenName = SCREENS.DASHBOARD_MAIN;
                                            } else if (tab.name === SCREENS.CHATS) {
                                                rootScreenName = SCREENS.CHAT_TAB;
                                            } else if (tab.name === SCREENS.SETTINGS) {
                                                rootScreenName = SCREENS.SETTINGS_MAIN;
                                            }

                                            if (rootScreenName) {
                                                navigation.navigate(tab.name, {
                                                    screen: rootScreenName,
                                                });
                                            }
                                        }
                                    } catch (err) {
                                        console.log('Error dispatching popToTop in listener:', err);
                                    }
                                }
                            }
                        }
                    })}
                />
            ))}
        </Tab.Navigator>
    );
}

function CustomTabBar({ state, navigation }: any) {
    const { user, darkMode } = useUser();
    const { unreadCount, listenUnreadCount } = useNotificationVM();
    const { conversations } = useConversationVM(user?.studentId);

    useEffect(() => {
        if (!user?.studentId) return;
        const unsub = listenUnreadCount(user.studentId);
        return () => unsub?.();
    }, [user?.studentId]);

    const unreadConversations = useMemo(
        () => conversations.filter((c: Conversation) => (c.unreadCount ?? 0) > 0).length,
        [conversations]
    );

    const theme = {
        bg: darkMode ? '#0F172A' : '#FFFFFF',
        border: darkMode ? '#1E293B' : '#E2E8F0',
        textInactive: darkMode ? '#64748B' : '#94A3B8',
        active: Colors.primary,
    };

    return (
        <View style={[styles.tabBar, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
            <SafeAreaView edges={['bottom']} style={styles.safeArea}>
                <View style={styles.buttonsContainer}>
                    {state.routes.map((route: any, index: number) => {
                        const tabItem = tabItems.find((t) => t.name === route.name);
                        if (!tabItem) return null;

                        const isFocused = state.index === index;
                        const IconComponent = tabItem.Icon;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                // If switching to a tab containing a nested stack from another tab, navigate directly to its root screen
                                if (route.name === SCREENS.DASHBOARD) {
                                    navigation.navigate(SCREENS.DASHBOARD, {
                                        screen: SCREENS.DASHBOARD_MAIN,
                                    });
                                } else if (route.name === SCREENS.CHATS) {
                                    navigation.navigate(SCREENS.CHATS, {
                                        screen: SCREENS.CHAT_TAB,
                                    });
                                } else if (route.name === SCREENS.SETTINGS) {
                                    navigation.navigate(SCREENS.SETTINGS, {
                                        screen: SCREENS.SETTINGS_MAIN,
                                    });
                                } else {
                                    navigation.navigate({ name: route.name, merge: true });
                                }
                            }
                        };

                        return (
                            <Pressable
                                key={route.key}
                                onPress={onPress}
                                style={styles.tabButton}
                            >
                                <View style={styles.iconContainer}>
                                    <IconComponent
                                        size={24}
                                        color={isFocused ? theme.active : theme.textInactive}
                                        weight={isFocused ? 'fill' : 'regular'}
                                    />
                                    {(
                                        (tabItem.name === SCREENS.CHATS && unreadConversations > 0) ||
                                        (tabItem.name === SCREENS.NOTIFICATIONS && unreadCount > 0)
                                    ) && (
                                            <View style={[styles.badge, { borderColor: theme.bg }]}>
                                                <Text style={styles.badgeText}>
                                                    {(tabItem.name === SCREENS.CHATS ? unreadConversations : unreadCount) > 9 ? '9+' : (tabItem.name === SCREENS.CHATS ? unreadConversations : unreadCount)}
                                                </Text>
                                            </View>
                                        )}
                                </View>
                                <Text style={[
                                    styles.tabLabel,
                                    { color: isFocused ? theme.active : theme.textInactive }
                                ]}>
                                    {tabItem.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        borderTopWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: -2 },
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    safeArea: {
        width: '100%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        height: 56, // Standard iOS tab bar height
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    tabButton: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    }
});
