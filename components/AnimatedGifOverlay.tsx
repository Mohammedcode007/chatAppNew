
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';

interface Props {
  gifUrl: string;
  soundPath: any;       // مثال: require('../assets/sound/phoenixsound.mp3')
  visible?: boolean;    // عرض المكون من البداية
  duration?: number;    // المدة الزمنية قبل الإغلاق (بالملي ثانية)
}

const AnimatedGifOverlay: React.FC<Props> = ({
  gifUrl,
  soundPath,
  visible = true,
  duration = 20000,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let activeSound: Audio.Sound;

    const start = async () => {
      if (!visible) return;

      setIsVisible(true);

      const newSound = new Audio.Sound();
      try {
        await newSound.loadAsync(soundPath);
        await newSound.setIsLoopingAsync(true);
        await newSound.playAsync();
        setSound(newSound);           // 🟢 حفظ المرجع في state
        activeSound = newSound;       // 🟢 مرجع للتنظيف
      } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
      }

      hideTimer = setTimeout(async () => {
        setIsVisible(false);
        if (activeSound) {
          try {
            await activeSound.stopAsync();
            await activeSound.unloadAsync();
          } catch (error) {
            console.error('فشل في إيقاف الصوت:', error);
          }
        }
      }, duration);
    };

    start();

    return () => {
      clearTimeout(hideTimer);
      if (activeSound) {
        activeSound.stopAsync().catch(() => {});
        activeSound.unloadAsync().catch(() => {});
      }
    };
  }, [visible, duration, soundPath]);

  if (!isVisible) return null;

  const htmlContent = `
    <html>
      <body style="margin:0; padding:0; background-color:transparent; overflow:hidden;">
        <img src="${gifUrl}" style="width:100vw; height:100vh; object-fit:cover;" />
      </body>
    </html>
  `;

  return (
    <View style={styles.overlay}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled
        allowsInlineMediaPlayback
        backgroundColor="transparent"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    position: 'absolute',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default AnimatedGifOverlay;
