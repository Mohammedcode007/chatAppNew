import React, { useState, useEffect } from 'react';
import { Alert, I18nManager } from 'react-native';
import axios from 'axios';  // إذا لم تكن أضفته
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';  // تأكد من أنك مهيئ i18n في مشروعك
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AuthInput from '@/components/AuthInput';
import { router } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import { loginUser } from '@/services/auth';
import { useDispatch } from 'react-redux';
import { setError, setLoading, setUser } from '@/store/userSlice';
import { useUserStatus } from '@/Hooks/useUserStatus';

// **افترض هنا وجود useThemeMode لإدارة الوضع الليلي**

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { darkMode } = useThemeMode();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const dispatch = useDispatch();
  const { status, error, loading, updateStatus } = useUserStatus('offline');



  const handleLogin = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    const result = await loginUser(username, password);

    dispatch(setLoading(false));

    if (result.success) {
      dispatch(setUser({ userData: result.user, token: result.token }));
      updateStatus('online', result.token); // الآن token مضمون أنه string

      // توجه للصفحة الرئيسية بعد تسجيل الدخول
      router.push('/(tabs)');
    } else {
      dispatch(setError(result.message || 'Login failed'));
      Alert.alert('Error', result.message || 'Login failed');
    }
  };





  const handleNavigateToRegister = () => {
    router.push('/auth/RegisterScreen');
  };
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
  return (
    <KeyboardAvoidingView
      style={[styles.container, darkMode && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, darkMode && styles.scrollContainerDark]}
        keyboardShouldPersistTaps="handled"
      >
        {/* الدوائر الخلفية */}
        <View style={[circleBase(darkMode), styles.circle1]} />
        <View style={[circleBase(darkMode), styles.circle2]} />
        <View style={[circleBase(darkMode), styles.circle3]} />

        <View style={styles.content}>
          {/* هنا يمكنك استخدام i18n لترجمة النصوص */}
          <Text style={[styles.title, darkMode && styles.titleDark]}>{i18n.t('loginToChatApp')}</Text>

          <AuthInput
            placeholder={i18n.t('username')}
            value={username}
            onChangeText={setUsername}
            iconName="person-outline"
            autoCapitalize="none"
            darkMode={darkMode}
            style={{ textAlign: isRTL ? 'right' : 'left' }}  // لضبط اتجاه النص في الحقل
          />
          {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

          <AuthInput
            placeholder={i18n.t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            iconName="lock-closed-outline"
            autoCapitalize="none"
            darkMode={darkMode}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <TouchableOpacity style={[styles.button, darkMode && styles.buttonDark]} onPress={handleLogin}>
            <Text style={styles.buttonText}>{i18n.t('login')}</Text>
          </TouchableOpacity>

          <Text style={[styles.infoText, darkMode && styles.infoTextDark]}>
            {i18n.t('connectWithFriends')}
          </Text>
          <Text style={[styles.infoText, darkMode && styles.infoTextDark]}>
            {i18n.t('joinMillionsUsers')}
          </Text>

          <TouchableOpacity onPress={handleNavigateToRegister}>
            <Text style={[styles.registerText, darkMode && styles.registerTextDark]}>
              {i18n.t('dontHaveAccountRegister')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const circleBase = (darkMode: boolean) => ({
  position: 'absolute' as const,
  borderRadius: 100,
  backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 122, 255, 0.15)',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  scrollContainerDark: {
    backgroundColor: 'transparent',
  },
  circle: {
    ...circleBase,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    left: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -30,
    right: -30,
  },
  circle3: {
    width: 250,
    height: 250,
    top: height * 0.3,
    right: -100,
  },
  content: {
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#491B6D',
    marginBottom: 30,
    textAlign: 'center',
  },
  titleDark: {
    color: '#491B6D',
  },
  button: {
    backgroundColor: '#491B6D',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonDark: {
    backgroundColor: '#491B6D',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 12,
    color: '#491B6D',
    fontSize: 14,
    textAlign: 'center',
  },
  infoTextDark: {
    color: '#ccc',
  },
  registerText: {
    marginTop: 20,
    color: '#491B6D',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  registerTextDark: {
    color: '#491B6D',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 8,
  },
});
