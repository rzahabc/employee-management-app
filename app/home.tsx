import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { exportToExcel, exportToPDF, getSettings } from '../utils/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      const url = type === 'excel' ? exportToExcel() : exportToPDF();
      const fileName = type === 'excel' ? 'employees.xlsx' : 'employees.pdf';
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('نجح', `تم حفظ الملف في: ${downloadResult.uri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('خطأ', 'فشل تصدير البيانات');
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      title: 'الأسماء',
      icon: 'people',
      color: '#007AFF',
      onPress: () => router.push('/employees'),
      show: true,
    },
    {
      title: 'القطاعات',
      icon: 'business',
      color: '#34C759',
      onPress: () => router.push('/branches'),
      show: canManage,
    },
    {
      title: 'المستخدمين',
      icon: 'person-add',
      color: '#FF9500',
      onPress: () => router.push('/users'),
      show: isAdmin,
    },
    {
      title: 'إعدادات التطبيق',
      icon: 'settings',
      color: '#8E44AD',
      onPress: () => router.push('/settings'),
      show: isAdmin,
    },
    {
      title: 'تصدير Excel',
      icon: 'document-text',
      color: '#32CD32',
      onPress: () => handleExport('excel'),
      show: canManage,
    },
    {
      title: 'تصدير PDF',
      icon: 'document',
      color: '#FF3B30',
      onPress: () => handleExport('pdf'),
      show: canManage,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {settings && (
        <View style={styles.appHeader}>
          {settings.logo_base64 && (
            <Image source={{ uri: settings.logo_base64 }} style={styles.headerLogo} />
          )}
          <Text style={styles.appHeaderText}>{settings.header_text}</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>الصفحة الرئيسية</Text>
          <Text style={styles.headerSubtitle}>
            مرحباً، {user?.username} ({user?.role === 'admin' ? 'مدير النظام' : user?.role === 'manager' ? 'مدير' : 'مستخدم'})
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.menuGrid}>
          {menuItems.filter(item => item.show).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.color + '15' }]}
              onPress={item.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={32} color="#fff" />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {settings && (
        <View style={styles.appFooter}>
          <Text style={styles.appFooterText}>{settings.footer_text}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  appHeader: {
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
  },
  appHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  appFooter: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  appFooterText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});