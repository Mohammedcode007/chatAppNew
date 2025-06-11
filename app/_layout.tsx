

// app/_layout.tsx أو RootLayout.tsx حسب بنية المشروع
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, I18nManager } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

import { ThemeContext } from '../context/ThemeContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import store, { persistor } from '@/store';
import { PersistGate } from 'redux-persist/integration/react';

// ⛔️ منع شاشة البداية من الاختفاء التلقائي
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem('appLanguage');
        const selectedLang = lang || 'en';
        await i18n.changeLanguage(selectedLang);

        const isArabic = selectedLang === 'ar';
        if (I18nManager.isRTL !== isArabic) {
          I18nManager.forceRTL(isArabic);
        }

        setLanguageLoaded(true);
      } catch (error) {
        console.error('فشل تحميل اللغة:', error);
        setLanguageLoaded(true);
      }
    };

    const loadDarkMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('darkMode');
        setDarkMode(stored === 'true');
      } catch (error) {
        console.error('فشل تحميل الوضع الليلي:', error);
        setDarkMode(false);
      }
    };

    loadLanguage();
    loadDarkMode();
  }, []);

  useEffect(() => {
    if (fontsLoaded && languageLoaded && darkMode !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, languageLoaded, darkMode]);

  const toggleDarkMode = async () => {
    try {
      const newMode = !darkMode;
      await AsyncStorage.setItem('darkMode', newMode.toString());
      setDarkMode(newMode);
    } catch (error) {
      console.error('فشل تغيير الوضع الليلي:', error);
    }
  };

  if (!fontsLoaded || !languageLoaded || darkMode === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebSocketProvider>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          }
          persistor={persistor}
        >
          <I18nextProvider i18n={i18n}>
            <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
              <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="splash" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="auth/LoginScreen"
                    options={{
                      title: i18n.t('loginTitle') || 'تسجيل الدخول',
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />

                  {/* شاشة التسجيل */}
                  <Stack.Screen
                    name="auth/RegisterScreen"
                    options={{
                      title: i18n.t('registerTitle') || 'تسجيل حساب جديد',
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="auth/AuthGate"
                    options={{
                      title: i18n.t('registerTitle') || 'تسجيل حساب جديد',
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="/chat/[userId]/index"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />

                  <Stack.Screen
                    name="/group/[groupId]/index"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="/group/[settingId]/index"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />

                  <Stack.Screen
                    name="/SearchUserScreen"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />
                    <Stack.Screen
                    name="/UserProfile"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="/CreateGroup"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />


                  <Stack.Screen
                    name="/Security/SecurityScreen"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />
                


                  <Stack.Screen
                    name="/StoreScreens/StoreScreens"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="/StoreScreens/PremiumPurchasePage"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />

                  <Stack.Screen
                    name="/FriendRequestsScreen"
                    options={{
                      headerShown: true,
                      animation: 'slide_from_right',
                    }}
                  />


                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
              </ThemeProvider>
            </ThemeContext.Provider>
          </I18nextProvider>
        </PersistGate>

      </Provider>

    </WebSocketProvider>

  );
}
