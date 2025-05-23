import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, I18nManager } from 'react-native';
import MoreItem from '@/components/MoreItem';
import { useTranslation } from 'react-i18next';
import LanguageModal from '@/components/LanguageModal';
import * as Updates from 'expo-updates';
import { useThemeMode } from '@/context/ThemeContext';

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import Colors from '@/constants/Colors';

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
            await Updates.reloadAsync(); // تم تعديل السطر هنا
        }

        setLanguageModalVisible(false);
    };


    const { darkMode, toggleDarkMode } = useThemeMode();


    const isRTL = language === 'ar';


    return (
        <ScrollView
            style={[styles.container, { backgroundColor: darkMode ? Colors.dark.background : Colors.light.background }, isRTL && styles.rtl]}
            contentContainerStyle={{ flexDirection: 'column' }}
        >

            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}

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

            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}

                icon="notifications-off-outline"
                title={t('Mute Notifications')}
                showSwitch
                switchEnabled={muteNotifications}
                onToggleSwitch={setMuteNotifications}
                direction={isRTL ? 'left' : 'right'}
            />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}

                icon="notifications-outline"
                title={t('Custom Notifications')}
                showSwitch
                switchEnabled={customNotifications}
                onToggleSwitch={setCustomNotifications}
                direction={isRTL ? 'left' : 'right'}
            />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="people-outline" title={t('Joined Groups')} direction={isRTL ? 'left' : 'right'}
            />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="person-add-outline" title={t('Invite Friends')} direction={isRTL ? 'left' : 'right'} />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="eye-off-outline" title={t('Hide Chat History')} direction={isRTL ? 'left' : 'right'} />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="shield-checkmark-outline" title={t('Security')} direction={isRTL ? 'left' : 'right'} />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="document-text-outline" title={t('Terms of App')} direction={isRTL ? 'left' : 'right'} />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="information-circle-outline" title={t('About App')} direction={isRTL ? 'left' : 'right'} />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}
                icon="help-circle-outline" title={t('Help Center')} direction={isRTL ? 'left' : 'right'} />
            <MoreItem textColor={darkMode ? Colors.dark.text : Colors.light.text}

                icon="log-out-outline"
                title={t('Log Out')}
                direction={isRTL ? 'left' : 'right'}
                onPress={() => console.log('Log Out')}
            />
            <LanguageModal
                visible={languageModalVisible}
                onClose={() => setLanguageModalVisible(false)}
                onSelectLanguage={handleLanguageChange}
                selectedLanguage={language}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        direction: 'ltr', // الافتراضي
    },
    rtl: {
        direction: 'rtl',
    },
});
