
import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    Alert.alert('تم', 'سيتم فتح شاشات البداية في المرة القادمة');
    
    // أو يمكنك توجيهه مباشرة الآن:
    // router.replace('/onboarding/Screen1');
  };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="إعادة تشغيل التطبيق كأول مرة" onPress={resetOnboarding} />
    </View>
  );
}
