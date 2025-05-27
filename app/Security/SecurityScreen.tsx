import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, Alert, StyleSheet,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecurityScreen = () => {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isFaceEnabled, setIsFaceEnabled] = useState(false);
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const pin = await AsyncStorage.getItem('security_pin');
      const face = await AsyncStorage.getItem('security_face');
      const finger = await AsyncStorage.getItem('security_fingerprint');

      setIsPinEnabled(pin === 'true');
      setIsFaceEnabled(face === 'true');
      setIsFingerprintEnabled(finger === 'true');
    })();
  }, []);

  const toggleSetting = async (
    key: string,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(value);
    await AsyncStorage.setItem(key, value.toString());
    Alert.alert('تم التحديث', value ? 'تم التفعيل بنجاح' : 'تم الإيقاف');
  };

  const handleAuthentication = async (type: 'face' | 'finger', value: boolean) => {
    const supported = await LocalAuthentication.hasHardwareAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const available = type === 'face'
      ? types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

    if (!supported || !available) {
      Alert.alert('غير مدعوم', type === 'face'
        ? 'التعرف على الوجه غير مدعوم على هذا الجهاز.'
        : 'بصمة الإصبع غير مدعومة على هذا الجهاز.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'يرجى التحقق من هويتك لتفعيل الميزة',
    });

    if (result.success) {
      if (type === 'face') {
        toggleSetting('security_face', value, setIsFaceEnabled);
      } else {
        toggleSetting('security_fingerprint', value, setIsFingerprintEnabled);
      }
    } else {
      Alert.alert('فشل المصادقة', 'لم يتم التحقق من الهوية.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>إعدادات الأمان</Text>

      <SecurityOption
        label="قفل PIN"
        value={isPinEnabled}
        onToggle={(val) => toggleSetting('security_pin', val, setIsPinEnabled)}
      />

      <SecurityOption
        label="التعرف على الوجه"
        value={isFaceEnabled}
        onToggle={(val) => handleAuthentication('face', val)}
      />

      <SecurityOption
        label="بصمة الإصبع"
        value={isFingerprintEnabled}
        onToggle={(val) => handleAuthentication('finger', val)}
      />
    </View>
  );
};

const SecurityOption = ({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) => {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Switch
        trackColor={{ false: '#ccc', true: '#4CAF50' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
        value={value}
        onValueChange={onToggle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 18,
    color: '#333',
  },
});

export default SecurityScreen;
