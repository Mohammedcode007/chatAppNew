import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeMode } from '@/context/ThemeContext';
import CustomHeader from '@/components/CustomHeader';
import { WebSocketProvider } from '@/context/WebSocketContext';
// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { darkMode } = useThemeMode(); // قراءة الوضع من الكونتكست
  const scheme = (darkMode ? 'dark' : 'light') as 'light' | 'dark';

  return (

    <Tabs
      key={scheme}
      screenOptions={{
            headerShown: false, // ⬅️ هذا يخفي الهيدر من كل الشاشات

        tabBarActiveTintColor: Colors[scheme].tint,
        headerStyle: {
          backgroundColor: Colors[scheme].background,
        },
        headerTintColor: Colors[scheme].text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={25}
            color={color}
          />,
         
        }}
      />
        <Tabs.Screen
        name="friends"  // اسم ملف الشاشة الخاصة بالأصدقاء داخل مجلد screens
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="users" size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Greoups"
        options={{
          title: 'Greoups',
          tabBarIcon: ({ color }) =>
            <FontAwesome6 name="people-group" size={25} color={color} />
          ,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <AntDesign name="profile" size={25} color={color} />
          ),

        }}
      />
      <Tabs.Screen
        name="More"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <Entypo name="menu" size={25} color={color} />
          ),
        }}
      />
    </Tabs>

  );
}
