// app/(tabs)/two.tsx

import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function TabTwoScreen() {
  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    Alert.alert('تم', 'سيتم فتح شاشات البداية في المرة القادمة');
    
    // أو يمكنك توجيهه مباشرة الآن:
    // router.replace('/onboarding/Screen1');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Two</Text>
      <Button title="إعادة تشغيل التطبيق كأول مرة" onPress={resetOnboarding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
});
