import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  // useEffect(() => {
  //   const checkOnboarding = async () => {
  //     try {
  //       const seen = await AsyncStorage.getItem('hasSeenOnboarding');
  //       console.log('hasSeenOnboarding:', seen);

  //       setTimeout(() => {
  //         if (seen === 'true') {
  //           router.replace('/(tabs)');
  //         } else {
  //           router.replace('/onboarding/Screen1');
  //         }
  //       }, 3000); // تأخير 3 ثواني لعرض الأنيميشن

  //     } catch (err) {
  //       console.error('AsyncStorage error', err);
  //     }
  //   };

  //   checkOnboarding();
  // }, []);
  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (seen === 'true') {
        console.log(seen);
        
        // توجه أولًا لشاشة التحقق الأمني
        router.replace('/auth/AuthGate');
      } else {
                console.log(seen);

        router.replace('/onboarding/Screen1');
      }
    };

    checkOnboarding();
  }, []);
  return (
    <View style={styles.container}>
      <LottieView
        source={require('@/assets/Lottie/loading-animation.json')}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
