import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const AuthGate = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinRequired, setPinRequired] = useState(false);
  const [pinStored, setPinStored] = useState('');

  useEffect(() => {
    const checkAuthSettings = async () => {
      try {
        const pin = await AsyncStorage.getItem('security_pin');
        const face = await AsyncStorage.getItem('security_face');
        const finger = await AsyncStorage.getItem('security_fingerprint');

        const biometricsEnabled = (face === 'true' || finger === 'true');
        const pinEnabled = pin === 'true';

        // إذا كانت بصمة الإصبع مفعلة
        if (finger === 'true') {
          const supported = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();

          if (supported && enrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'الرجاء التحقق من بصمة الإصبع للدخول',
              cancelLabel: 'إلغاء',
              fallbackLabel: 'أدخل رمز المرور',
            });

            if (result.success) {
              setLoading(false);
              router.replace('/auth/LoginScreen');
              return;
            } else {
              Alert.alert('فشل التحقق', 'يجب التحقق من بصمة الإصبع للدخول.');
              setLoading(false);
              return;
            }
          } else {
            Alert.alert('غير مدعوم', 'بصمة الإصبع غير مدعومة أو غير مفعلة على هذا الجهاز.');
            setLoading(false);
            router.replace('/auth/LoginScreen');
            return;
          }
        }

        // إذا كانت بصمة الوجه مفعلة (كخيار بديل)
        if (face === 'true') {
          const supported = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();

          if (supported && enrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'الرجاء التحقق من التعرف على الوجه للدخول',
              cancelLabel: 'إلغاء',
              fallbackLabel: 'أدخل رمز المرور',
            });

            if (result.success) {
              setLoading(false);
              router.replace('/auth/LoginScreen');
              return;
            } else {
              Alert.alert('فشل التحقق', 'يجب التحقق من التعرف على الوجه للدخول.');
              setLoading(false);
              return;
            }
          } else {
            Alert.alert('غير مدعوم', 'التعرف على الوجه غير مدعوم أو غير مفعّل على هذا الجهاز.');
            setLoading(false);
            router.replace('/auth/LoginScreen');
            return;
          }
        }

        // إذا كان الـ PIN مفعل
        if (pinEnabled) {
          const storedPin = await AsyncStorage.getItem('user_pin_code');
          setPinStored(storedPin || '');
          setPinRequired(true);
          setLoading(false);
          return;
        }

        // إذا لم يتم تفعيل أي حماية
        setLoading(false);
        router.replace('/auth/LoginScreen');

      } catch (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء التحقق.');
        setLoading(false);
      }
    };

    checkAuthSettings();
  }, []);

  const handlePinSubmit = () => {
    if (pinInput === pinStored) {
      router.replace('/auth/LoginScreen');
    } else {
      Alert.alert('خطأ', 'الرمز غير صحيح.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>جارٍ التحقق من الهوية...</Text>
      </View>
    );
  }

  if (pinRequired) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>أدخل رمز PIN الخاص بك</Text>
        <TextInput
          value={pinInput}
          onChangeText={setPinInput}
          secureTextEntry
          keyboardType="numeric"
          style={styles.input}
          maxLength={6}
        />
        <Button title="تأكيد" onPress={handlePinSubmit} />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
  },
});

export default AuthGate;
