import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { createNativeStackNavigator as createStack } from '@react-navigation/native-stack';
import { AlertProvider } from './src/contexts/AlertContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLoadUser, UserProvider, useUser } from './src/contexts/UserContext';
import LoginScreen from './src/screens/LoginScreen';
import * as Location from 'expo-location';
import { CallStackScreen } from "./src/navigation/CallStack";
import { LoadingProvider } from './src/contexts/LoadingContext';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { Platform, StatusBar, UIManager, Text, View, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { navigationRef } from './src/navigation/RootNavigation';
import { RootStackParamList } from './src/navigation/types';
import { useNotificationListeners } from './src/components/NotificationsManager';
import { ImageFullModalProvider } from './src/contexts/ImageFullModalContext';
import { PresenceProvider } from './src/contexts/PresenceContext';
import { InAppNotificationProvider } from './src/contexts/InAppNotificationContext';
import { RefreshProvider } from './src/contexts/RefreshContext';
import { Colors } from './src/utils/theme';
import MainApp from './MainApp';
import { consumePendingNotification } from './src/helpers/notificationQueue';
import { handleNotificationRedirect } from './src/helpers/notificationRedirect';
import { initConfig } from './src/configs/config';
import { configService } from './src/services/configService';

const Stack = createStack<RootStackParamList>();

export default function App() {
  useEffect(() => {
    initConfig().then(() => configService.fetchAndSyncApiConfig());
  }, []);

  if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <UserProvider>
          <LoadingProvider>
            <AlertProvider>
              <InAppNotificationProvider>
                <ImageFullModalProvider>
                  <View style={{ flex: 1 }}>
                    <AppNavigator />
                    <LoadingOverlay />
                  </View>
                </ImageFullModalProvider>
              </InAppNotificationProvider>
            </AlertProvider>
          </LoadingProvider>
        </UserProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const TextAny = Text as any;
TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.style = { color: Colors.text };


function AppNavigator() {
  const { user } = useUser();
  return (
    <PresenceProvider studentId={user?.studentId}>
      <AppNavigatorInner />
    </PresenceProvider>
  );
}

function AppNavigatorInner() {
  useLoadUser();
  useNotificationListeners();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!user) return;
    const data = consumePendingNotification();
    if (data) {
      setTimeout(() => handleNotificationRedirect(data), 300);
    }
  }, [user]);

  if (loading) return null;

  return (
    <RefreshProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="MainApp" component={MainApp} />
              <Stack.Screen name="Call" component={CallStackScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </RefreshProvider>
  );
}