import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, I18nManager, SafeAreaView, Button, TextInput, Text, Modal, ToastAndroid } from 'react-native';
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
import { API_URL } from '@/config';
import { useUserStatus } from '@/Hooks/useUserStatus';
import { useSensitiveInfoUpdater } from '@/Hooks/useSensitiveInfoUpdater';
export default function MoreScreen() {
    const { t } = useTranslation();
    const [muteNotifications, setMuteNotifications] = useState(false);
    const [customNotifications, setCustomNotifications] = useState(false);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);
    const [language, setLanguage] = useState('en');
    const [changePassModalVisible, setChangePassModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reNewPassword, setReNewPassword] = useState('');
    const {
        updateSensitiveInfo,
        successMessage,
        errorMessage,
    } = useSensitiveInfoUpdater();
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !reNewPassword) {
            Alert.alert(t('Error'), t('Please fill all fields'));
            return;
        }

        if (newPassword !== reNewPassword) {
            Alert.alert(t('Error'), t('Passwords do not match'));
            return;
        }

        try {
            updateSensitiveInfo(oldPassword, { password: newPassword });



            setChangePassModalVisible(false);
            setOldPassword('');
            setNewPassword('');
            setReNewPassword('');
        } catch (err) {
            console.error('Password change error:', err);
            Alert.alert(t('Error'), t('Failed to change password'));
        }
    };
    useEffect(() => {
        if (successMessage) {
            ToastAndroid.show(successMessage, ToastAndroid.SHORT);

        } else if (errorMessage) {
            ToastAndroid.show(errorMessage, ToastAndroid.SHORT);

        }
    }, [successMessage, errorMessage]);

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
    const { status, error, loading, updateStatus } = useUserStatus('offline');

    const { darkMode, toggleDarkMode } = useThemeMode();
    const isRTL = language === 'ar';
    const logout = async () => {
        try {
            // استدعاء API تسجيل الخروج (اختياري)
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                console.log(token);
                updateStatus('offline', token); // الآن token مضمون أنه string

                await axios.post(
                    `${API_URL}/logout`,
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
                    icon="person-add-outline"
                    title={t('Invite Friends')}
                    direction={isRTL ? 'left' : 'right'}
                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="key-outline"
                    title={t('Change Password')}
                    direction={isRTL ? 'left' : 'right'}
                    onPress={() => setChangePassModalVisible(true)}
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
                    icon="storefront-outline"
                    title={t('Store')}
                    direction={isRTL ? 'left' : 'right'}
                    onPress={() => router.push('/StoreScreens/StoreScreens')}

                />
                <MoreItem
                    textColor={darkMode ? Colors.dark.text : Colors.light.text}
                    icon="storefront-outline"
                    title={t('Premium')}
                    direction={isRTL ? 'left' : 'right'}
                    onPress={() => router.push('/StoreScreens/PremiumPurchasePage')}

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
                <Modal
                    visible={changePassModalVisible}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setChangePassModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContainer, { backgroundColor: darkMode ? Colors.dark.background : Colors.light.background }]}>


                            <TextInput
                                style={[styles.input, { color: darkMode ? '#fff' : '#000' }]}
                                placeholder={t('Old Password')}
                                placeholderTextColor={darkMode ? '#aaa' : '#666'}
                                secureTextEntry
                                value={oldPassword}
                                onChangeText={setOldPassword}
                            />

                            <TextInput
                                style={[styles.input, { color: darkMode ? '#fff' : '#000' }]}
                                placeholder={t('New Password')}
                                placeholderTextColor={darkMode ? '#aaa' : '#666'}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />

                            <TextInput
                                style={[styles.input, { color: darkMode ? '#fff' : '#000' }]}
                                placeholder={t('Repeat New Password')}
                                placeholderTextColor={darkMode ? '#aaa' : '#666'}
                                secureTextEntry
                                value={reNewPassword}
                                onChangeText={setReNewPassword}
                            />

                            <View style={styles.modalButtonsContainer}>
                                <Text style={styles.cancelText} onPress={() => setChangePassModalVisible(false)}>
                                    {t('Cancel')}
                                </Text>
                                <Text style={styles.saveText} onPress={handleChangePassword}>
                                    {t('Save')}
                                </Text>
                            </View>

                        </View>
                    </View>
                </Modal>



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
    modalContainer: {
        width: '90%',
        borderRadius: 16,
        padding: 20,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '90%',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 12,
    },
    cancelText: {
        color: '#FF3B30', // لون أحمر دلالة على الإلغاء
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 20,
    },
    saveText: {
        color: '#007AFF', // أزرق iOS-style
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
        color: '#000',
    },


});
