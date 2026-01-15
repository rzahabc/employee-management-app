import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  role: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'manager':
        return 'مدير';
      case 'user':
        return 'مستخدم';
      default:
        return role;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={40} color="#4a90d9" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.username}</Text>
              <Text style={styles.userRole}>{getRoleName(user?.role || '')}</Text>
            </View>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة البيانات</Text>

          {isAdmin && (
            <>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/manage-users')}
              >
                <Ionicons name="chevron-back" size={20} color="#888" />
                <View style={styles.settingContent}>
                  <Text style={styles.settingText}>إدارة المستخدمين</Text>
                  <Ionicons name="people" size={24} color="#4a90d9" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/manage-sectors')}
              >
                <Ionicons name="chevron-back" size={20} color="#888" />
                <View style={styles.settingContent}>
                  <Text style={styles.settingText}>إدارة القطاعات</Text>
                  <Ionicons name="business" size={24} color="#4a90d9" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/app-settings')}
              >
                <Ionicons name="chevron-back" size={20} color="#888" />
                <View style={styles.settingContent}>
                  <Text style={styles.settingText}>إعدادات التطبيق</Text>
                  <Ionicons name="settings" size={24} color="#4a90d9" />
                </View>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/export')}
          >
            <Ionicons name="chevron-back" size={20} color="#888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>تصدير البيانات</Text>
              <Ionicons name="download" size={24} color="#4a90d9" />
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عن التطبيق</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>1.0.0</Text>
            <Text style={styles.infoLabel}>الإصدار</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'right',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginRight: 15,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: '#4a90d9',
    marginTop: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
  },
});
