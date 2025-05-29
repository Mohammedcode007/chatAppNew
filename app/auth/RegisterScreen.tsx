import React, { useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';  // تأكد من أنك مهيئ i18n في مشروعك
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ActivityIndicator } from 'react-native';

import AuthInput from '@/components/AuthInput';
import { router } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import { registerUser } from '@/services/auth';

const { height } = Dimensions.get('window');



export default function RegisterScreen({ navigation }: { navigation: any }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    email: '',
  });

  const { darkMode } = useThemeMode();

  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const getStoredLang = async () => {
      try {
        const lang = await AsyncStorage.getItem('appLanguage');
        if (lang) {
          setLanguage(lang);
          i18n.changeLanguage(lang);
          I18nManager.forceRTL(lang === 'ar');
        }
      } catch (e) {
        console.error('Failed to load language from storage', e);
      }
    };
    getStoredLang();
  }, []);

  const isRTL = language === 'ar';

  const validateEmail = (email: string) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
  };

  const handleRegister = async () => {
    let tempErrors = { username: '', password: '', email: '' };
    let valid = true;

    if (!username) {
      tempErrors.username = i18n.t('errors.usernameRequired');
      valid = false;
    }

    if (!password) {
      tempErrors.password = i18n.t('errors.passwordRequired');
      valid = false;
    }

    if (!email) {
      tempErrors.email = i18n.t('errors.emailRequired');
      valid = false;
    } else if (!validateEmail(email)) {
      tempErrors.email = i18n.t('errors.emailInvalid');
      valid = false;
    }

    setErrors(tempErrors);

    if (!valid) return;

    try {
      setLoading(true); // تفعيل التحميل
      const result = await registerUser(username, password, email);

      if (result.success) {
        Alert.alert(i18n.t('register.successTitle'), i18n.t('register.successMessage'));
        router.push('/auth/LoginScreen');
      } else {
        Alert.alert(i18n.t('register.failedTitle'), result.message || i18n.t('register.failedMessage'));
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert(i18n.t('register.failedTitle'), i18n.t('register.failedMessage'));
    } finally {
      setLoading(false); // إيقاف التحميل
    }
  };


  const dynamicStyles = getStyles(darkMode, isRTL);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[dynamicStyles.circle, dynamicStyles.circle1]} />
        <View style={[dynamicStyles.circle, dynamicStyles.circle2]} />
        <View style={[dynamicStyles.circle, dynamicStyles.circle3]} />

        <View style={dynamicStyles.content}>
          <Text style={dynamicStyles.title}>{i18n.t('register.createAccount')}</Text>

          <AuthInput
            placeholder={i18n.t('register.username')}
            value={username}
            darkMode={darkMode}
            onChangeText={setUsername}
            iconName="person-outline"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {errors.username ? <Text style={dynamicStyles.errorText}>{errors.username}</Text> : null}

          <AuthInput
            placeholder={i18n.t('register.password')}
            value={password}
            darkMode={darkMode}
            onChangeText={setPassword}
            secureTextEntry
            iconName="lock-closed-outline"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {errors.password ? <Text style={dynamicStyles.errorText}>{errors.password}</Text> : null}

          <AuthInput
            placeholder={i18n.t('register.email')}
            value={email}
            darkMode={darkMode}
            onChangeText={setEmail}
            keyboardType="email-address"
            iconName="mail-outline"
            autoCapitalize="none"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {errors.email ? <Text style={dynamicStyles.errorText}>{errors.email}</Text> : null}
          <TouchableOpacity
            style={dynamicStyles.button} onPress={handleRegister}
            disabled={loading}  // تعطيل الزر أثناء التحميل
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={dynamicStyles.buttonText}>{i18n.t('register.register')}</Text>
            )}
          </TouchableOpacity>



          <Text style={dynamicStyles.infoText}>{i18n.t('register.info1')}</Text>
          <Text style={dynamicStyles.infoText}>{i18n.t('register.info2')}</Text>

          <TouchableOpacity onPress={() => router.push('/auth/LoginScreen')}>
            <Text style={dynamicStyles.registerText}>{i18n.t('register.loginHere')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (darkMode: boolean, isRTL: boolean) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: darkMode ? '#121212' : '#fff',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    circle: {
      position: 'absolute',
      borderRadius: 100,
      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 122, 255, 0.15)',
    },
    circle1: { width: 200, height: 200, top: -50, left: -50 },
    circle2: { width: 150, height: 150, bottom: -30, right: -30 },
    circle3: { width: 250, height: 250, top: height * 0.3, right: -100 },
    content: { zIndex: 1 },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: darkMode ? '#fff' : '#491B6D',
      marginBottom: 30,
      textAlign: 'center',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    button: {
      backgroundColor: '#491B6D',
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 20,
    },
    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    infoText: {
      marginTop: 12,
      color: darkMode ? '#ccc' : '#491B6D',
      fontSize: 14,
      textAlign: 'center',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    registerText: {
      marginTop: 20,
      color: darkMode ? '#bbb' : '#491B6D',
      fontSize: 16,
      textAlign: 'center',
      textDecorationLine: 'underline',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    errorText: {
      color: 'red',
      fontSize: 13,
      marginTop: 4,
      marginBottom: 8,
      marginLeft: 8,
      writingDirection: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
    },
  });
