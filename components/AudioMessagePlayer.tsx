import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface AudioMessagePlayerProps {
  uri: string;
  duration?: number;
  isMyMessage: boolean;
}

export default function AudioMessagePlayer({ uri, duration, isMyMessage }: AudioMessagePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // تنظيف الصوت عند فك تحميل المكون
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      setIsPlaying(false);
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      // إيقاف الصوت
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
    } else {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      } catch (error) {
        console.warn('Error playing audio:', error);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePlayPause}
      style={[styles.audioContainer, { backgroundColor: isMyMessage ? '#0b93f6' : '#e5e5ea' }]}
    >
      <Ionicons
        name={isPlaying ? 'pause-circle' : 'play-circle'}
        size={30}
        color={isMyMessage ? '#fff' : '#000'}
      />
      <Text style={{ marginLeft: 10, color: isMyMessage ? '#fff' : '#000', fontSize: 16 }}>
        {duration ? `${duration}s` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 150,
    padding: 8,
    borderRadius: 10,
  },
});
