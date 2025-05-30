import React, { useState, useEffect, useRef } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Animated } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  uri: string;
};

const barCount = 20;

const AudioMessage: React.FC<Props> = ({ uri }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);

  const animatedHeights = useRef<Animated.Value[]>([]).current;

  if (animatedHeights.length === 0) {
    for (let i = 0; i < barCount; i++) {
      animatedHeights.push(new Animated.Value(10));
    }
  }

  const animateWaveform = () => {
    const animations = animatedHeights.map((anim) =>
      Animated.timing(anim, {
        toValue: 5 + Math.random() * 25,
        duration: 200,
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  };

const startWaveAnimation = () => {
  // نحسب مدة التكرار (intervalDuration) حسب مدة الصوت (durationMillis)
  // نحدد فترة الحركة لتكون بين 100 مللي ثانية (للأصوات القصيرة) إلى 800 مللي ثانية (للأصوات الطويلة)
  const minDuration = 100;
  const maxDuration = 800;

  // نحسب النسبة (1 للمقاطع القصيرة، 0 للمقاطع الطويلة)
  const ratio = durationMillis ? Math.min(durationMillis / 60000, 1) : 0; // مدة الصوت مقسومة على دقيقة

  // نحدد مدة الحركة بتدرج عكسي (أصوات طويلة بطيئة، قصيرة سريعة)
  const intervalDuration = maxDuration - (maxDuration - minDuration) * (1 - ratio);

  const interval = setInterval(() => {
    animateWaveform();
  }, intervalDuration);

  return interval;
};


  const toggleSound = async () => {
    if (!sound) {
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      if (status.isLoaded) {
        setDurationMillis(status.durationMillis ?? 0);
        setPositionMillis(status.positionMillis ?? 0);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if ("isPlaying" in status) {
          setIsPlaying(status.isPlaying);
          setPositionMillis(status.positionMillis ?? 0);
          setDurationMillis(status.durationMillis ?? 0);

          if (!status.isPlaying && status.positionMillis === status.durationMillis) {
            setIsPlaying(false);
            setSound(null);
            setPositionMillis(0);
          }
        }
      });
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatMillisToTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressRatio = durationMillis
    ? positionMillis / durationMillis
    : 0;

  const activeBars = Math.floor(barCount * progressRatio);

const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = startWaveAnimation();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        animatedHeights.forEach((anim) => anim.setValue(10));
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <TouchableOpacity onPress={toggleSound} style={styles.container}>
      <Ionicons
        name={isPlaying ? "pause-circle" : "play-circle"}
        size={20}
        color="#007AFF"
        style={styles.icon}
      />

      <View style={styles.waveformContainer}>
        {animatedHeights.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: anim,
                backgroundColor: index < activeBars ? "#007AFF" : "#bbb",
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.timeText}>
        {formatMillisToTime(positionMillis)} / {formatMillisToTime(durationMillis)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 230,
    gap: 10,
  },
  icon: {
    marginHorizontal: 1,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 30,
    flex: 1,
    marginHorizontal: 5,
    gap: 2,
  },
  bar: {
    width: 2,
    borderRadius: 2,
  },
  timeText: {
    fontSize: 12,
    color: "#555",
  },
});

export default AudioMessage;
