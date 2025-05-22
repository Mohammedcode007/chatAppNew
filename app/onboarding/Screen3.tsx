import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import CustomButton from '@/components/CustomButton';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ إضافة AsyncStorage

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const options = {
  headerShown: false,
};

export default function Screen3() {
  const [currentIndex, setCurrentIndex] = useState(2);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // ✅ تخزين انتهاء الـ onboarding
  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('خطأ في حفظ حالة onboarding:', error);
    }
  };

  const skipOnboarding = () => {
    finishOnboarding();
  };

  return (
    <View style={styles.fullContainer}>
      <View style={styles.topHalf} />

      <LinearGradient
        colors={['#FFF', '#e0f7fa', '#26c6da']}
        style={styles.bottomHalf}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image
          source={require('@/assets/images/onboarding3.png')}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>جاهز للانطلاق؟</Text>
        <Text style={styles.description}>
          أنشئ حسابك وابدأ بالتواصل مع أصدقائك الآن.
        </Text>

        <View style={styles.indicators}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <CustomButton
          title="ابدأ الآن"
          onPress={finishOnboarding}
          width={SCREEN_WIDTH * 0.8}
          borderWidth={1}
          borderColor="#007AFF"
          backgroundColor="#007AFF"
          color="#fff"
          style={{ marginTop: 30 }}
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={skipOnboarding}>
            <Text style={styles.skipText}>تخطي</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={finishOnboarding}>
            <Text style={styles.nextText}>ابدأ</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  topHalf: {
    position: 'absolute',
    top: 0,
    height: '50%',
    width: '100%',
    backgroundColor: '#fff',
    zIndex: -1,
  },
  bottomHalf: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  indicators: {
    flexDirection: 'row',
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#007AFF',
    width: 12,
    height: 12,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: "50%",
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  nextText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
