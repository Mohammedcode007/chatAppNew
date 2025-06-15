// import React, { useEffect, useState } from 'react';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import { Link, Tabs } from 'expo-router';
// import { Pressable } from 'react-native';
// import AntDesign from '@expo/vector-icons/AntDesign';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import Entypo from '@expo/vector-icons/Entypo';
// import Colors from '@/constants/Colors';
// import { useColorScheme } from '@/components/useColorScheme';
// import { useClientOnlyValue } from '@/components/useClientOnlyValue';
// import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useThemeMode } from '@/context/ThemeContext';
// import CustomHeader from '@/components/CustomHeader';
// import { WebSocketProvider } from '@/context/WebSocketContext';
// // You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
// function TabBarIcon(props: {
//   name: React.ComponentProps<typeof FontAwesome>['name'];
//   color: string;
// }) {
//   return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
// }

// export default function TabLayout() {
//   const { darkMode } = useThemeMode(); // قراءة الوضع من الكونتكست
//   const scheme = (darkMode ? 'dark' : 'light') as 'light' | 'dark';

//   return (

//     <Tabs
//       key={scheme}
//       screenOptions={{
//             headerShown: false, // ⬅️ هذا يخفي الهيدر من كل الشاشات

//         tabBarActiveTintColor: Colors[scheme].tint,
//         headerStyle: {
//           backgroundColor: Colors[scheme].background,
//         },
//         headerTintColor: Colors[scheme].text,
//         headerTitleStyle: {
//           fontWeight: 'bold',
//         },

//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Chats',
//           tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={25}
//             color={color}
//           />,

//         }}
//       />
//         <Tabs.Screen
//         name="friends"  // اسم ملف الشاشة الخاصة بالأصدقاء داخل مجلد screens
//         options={{
//           title: 'Friends',
//           tabBarIcon: ({ color }) => (
//             <FontAwesome6 name="users" size={25} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="Greoups"
//         options={{
//           title: 'Greoups',
//           tabBarIcon: ({ color }) =>
//             <FontAwesome6 name="people-group" size={25} color={color} />
//           ,
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: 'Profile',
//           tabBarIcon: ({ color }) => (
//             <AntDesign name="profile" size={25} color={color} />
//           ),

//         }}
//       />
//       <Tabs.Screen
//         name="More"
//         options={{
//           title: 'More',
//           tabBarIcon: ({ color }) => (
//             <Entypo name="menu" size={25} color={color} />
//           ),
//         }}
//       />
//     </Tabs>

//   );
// }


// app/_layout.tsx أو wherever your Tabs layout is
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Colors from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

function AnimatedTabIcon({
  icon,
  focused,
}: {
  icon: React.ReactNode;
  focused: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 300 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle((): ViewStyle => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.25], Extrapolate.CLAMP);
    const rotateDeg = interpolate(progress.value, [0, 1], [0, 10], Extrapolate.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0.6, 1]);

    return {
      transform: [
        { scale },
        { rotate: `${rotateDeg}deg` }, // ✅ هنا التصحيح
      ],
      opacity,
    };
  });


  return <Animated.View style={animatedStyle}>{icon}</Animated.View>;
}

export default function TabLayout() {
  const { darkMode } = useThemeMode();
  const scheme = (darkMode ? 'dark' : 'light') as 'light' | 'dark';

  return (
    <Tabs
      key={scheme}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF4C98',         // لون التبويب النشط (أيقونة + نص)
        tabBarInactiveTintColor: '#999', tabBarStyle: {
          backgroundColor: Colors[scheme].background,
          borderTopWidth: 0.5,
          borderTopColor: Colors[scheme].tint + '20',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} icon={
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />
            } />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} icon={
              <FontAwesome6 name="users" size={23} color={color} />
            } />
          ),
        }}
      />
      <Tabs.Screen
        name="Greoups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} icon={
              <FontAwesome6 name="people-group" size={23} color={color} />
            } />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} icon={
              <AntDesign name="profile" size={23} color={color} />
            } />
          ),
        }}
      />
      <Tabs.Screen
        name="More"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} icon={
              <Entypo name="menu" size={24} color={color} />
            } />
          ),
        }}
      />
    </Tabs>
  );
}
