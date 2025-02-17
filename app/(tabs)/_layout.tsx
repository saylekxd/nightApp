import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/auth';
import { router, useSegments } from 'expo-router';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    checkAdmin();
  }, [segments]);

  const checkAdmin = async () => {
    try {
      const profile = await getProfile();
      setIsAdmin(profile.is_admin || false);
      
      // Check if we're in the admin section using segments
      const isInAdminSection = segments.includes('admin');
      if (!profile.is_admin && isInAdminSection) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      setIsAdmin(false);
      const isInAdminSection = segments.includes('admin');
      if (isInAdminSection) {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              backgroundColor: 'transparent',
            },
            android: {
              backgroundColor: '#1a1a1a',
            },
            web: {
              backgroundColor: '#1a1a1a',
            },
          }),
        },
        tabBarBackground: Platform.OS === 'ios' ? () => (
          <BlurView
            tint="dark"
            intensity={100}
            style={StyleSheet.absoluteFill}
          />
        ) : undefined,
        tabBarActiveTintColor: '#ff3b7f',
        tabBarInactiveTintColor: '#ffffff80',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr-code"
        options={{
          title: 'My QR',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}