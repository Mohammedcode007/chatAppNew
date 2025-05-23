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
        tabBarActiveTintColor: Colors[scheme].tint,
        headerShown: useClientOnlyValue(false, true),
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
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (

                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[scheme].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
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
