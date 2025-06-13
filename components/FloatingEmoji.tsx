import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';

type FloatingEmojiProps = {
  emoji: string;
  count?: number;
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ emoji, count = 50 }) => {
  const [emojis, setEmojis] = useState<number[]>([]);

  useEffect(() => {
    const ids = Array.from({ length: count }, (_, i) => i);
    setEmojis(ids);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {emojis.map((id) => (
        <SingleFloatingEmoji key={id} emoji={emoji} />
      ))}
    </View>
  );
};

const SingleFloatingEmoji: React.FC<{ emoji: string }> = ({ emoji }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const left = Math.random() * (SCREEN_WIDTH - 40); // تجنب الخروج من الشاشة
  const duration = 5000 + Math.random() * 2000; // بين 5 إلى 7 ثوانٍ
  const rotationDeg = 360 + Math.random() * 720;
  const verticalDistance = -SCREEN_HEIGHT * (0.9 + Math.random() * 0.1); // ارتفاع للشاشة كاملة تقريبًا

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: verticalDistance,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotationDeg}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.emoji,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
        },
      ]}
    >
      <Text style={styles.emojiText}>{emoji}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    bottom: 0,
  },
  emojiText: {
    fontSize: 30,
  },
});

export default FloatingEmoji;
