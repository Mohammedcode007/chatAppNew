import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, I18nManager, SafeAreaView } from 'react-native';
import MoreItem from '@/components/MoreItem';
import { useTranslation } from 'react-i18next';
import LanguageModal from '@/components/LanguageModal';
import * as Updates from 'expo-updates';
import { useThemeMode } from '@/context/ThemeContext';

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import Colors from '@/constants/Colors';
import CustomHeader from '@/components/CustomHeader';
import { Alert } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
export default function MoreScreen() {
    const { t } = useTranslation();
    const [muteNotifications, setMuteNotifications] = useState(false);
    const [customNotifications, setCustomNotifications] = useState(false);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const getStoredLang = async () => {
            const lang = await AsyncStorage.getItem('appLanguage');
            if (lang) {
                setLanguage(lang);
                i18n.changeLanguage(lang);
                I18nManager.forceRTL(lang === 'ar');
            }
        };
        getStoredLang();
    }, []);

    const handleLanguageChange = async (lang: 'en' | 'ar') => {
        setLanguage(lang);
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem('appLanguage', lang);

        const isArabic = lang === 'ar';
        if (I18nManager.isRTL !== isArabic) {
            I18nManager.forceRTL(isArabic);
            await Updates.reloadAsync();
        }

        setLanguageModalVisible(false);
    };

    const { darkMode, toggleDarkMode } = useThemeMode();
    const isRTL = language === 'ar';
    const logout = async () => {
        try {
            // استدعاء API تسجيل الخروج (اختياري)
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                console.log(token);

                await axios.post(
                    'http://192.168.80.248:3000/logout',
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
            }

            // حذف التوكن من التخزين المحلي
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('hasSeenOnboarding');

            // توجيه المستخدم لشاشة تسجيل الدخول
            router.push('/auth/LoginScreen');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Logout Failed', 'Please try again later.');
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: darkMode ? Colors.dark.background : Colors.light.background }]}>
            <CustomHeader />

            <ScrollView
                style={[styles.container, isRTL && styles.rtl]}
                contentContainerStyle={{ flexDirection: 'column' }}
            >
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="language-outline"
                    title={`${t('Language')} (${language === 'en' ? 'English' : 'العربية'})`}
                    direction={isRTL ? 'left' : 'right'}
                    onPress={() => setLanguageModalVisible(true)}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="moon-outline"
                    title={t('Dark_Mode')}
                    showSwitch
                    switchEnabled={darkMode}
                    onToggleSwitch={toggleDarkMode}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="notifications-off-outline"
                    title={t('Mute Notifications')}
                    showSwitch
                    switchEnabled={muteNotifications}
                    onToggleSwitch={setMuteNotifications}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="notifications-outline"
                    title={t('Custom Notifications')}
                    showSwitch
                    switchEnabled={customNotifications}
                    onToggleSwitch={setCustomNotifications}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="people-outline"
                    title={t('Joined Groups')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="person-add-outline"
                    title={t('Invite Friends')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="eye-off-outline"
                    title={t('Hide Chat History')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="shield-checkmark-outline"
                    title={t('Security')}
                    direction={isRTL ? 'left' : 'right'}
                        onPress={() => router.push('/Security/SecurityScreen')}

                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="document-text-outline"
                    title={t('Terms of App')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="information-circle-outline"
                    title={t('About App')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="help-circle-outline"
                    title={t('Help Center')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="log-out-outline"
                    title={t('Log Out')}
                    direction={isRTL ? 'left' : 'right'}
                    onPress={() => logout()}
                />
                <LanguageModal
                    visible={languageModalVisible}
                    onClose={() => setLanguageModalVisible(false)}
                    onSelectLanguage={handleLanguageChange}
                    selectedLanguage={language}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        direction: 'ltr', // الافتراضي
    },
    rtl: {
        direction: 'rtl',
    },
});
