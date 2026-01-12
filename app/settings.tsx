import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, updateSettings } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      router.back();
      return;
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setHeaderText(data.header_text);
      setFooterText(data.footer_text);
      setLogo(data.logo_base64);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('خطأ', 'فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  };

  const selectLogo = async () => {
    const hasPermissions = await requestPermissions();
    
    if (!hasPermissions) {
      Alert.alert('خطأ', 'يتطلب التطبيق أذونات الكاميرا والمعرض');
      return;
    }

    Alert.alert('إضافة لوجو', 'اختر الطريقة', [
      {
        text: 'الكاميرا',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
          });

          if (!result.canceled && result.assets[0].base64) {
            setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      {
        text: 'المعرض',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
          });

          if (!result.canceled && result.assets[0].base64) {
            setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!headerText.trim() || !footerText.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال النصوص المطلوبة');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        header_text: headerText.trim(),
        footer_text: footerText.trim(),
        logo_base64: logo,
      });

      Alert.alert('نجح', 'تم حفظ الإعدادات بنجاح', [
        {
          text: 'موافق',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إعدادات التطبيق</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>النص العلوي (Header)</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="مثال: منطقة شرق الدلتا"
                value={headerText}
                onChangeText={setHeaderText}
                textAlign="right"
              />
            </View>

            <Text style={styles.sectionTitle}>اللوجو</Text>
            <TouchableOpacity style={styles.logoContainer} onPress={selectLogo}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image" size={48} color="#999" />
                  <Text style={styles.logoPlaceholderText}>إضافة لوجو</Text>
                </View>
              )}
            </TouchableOpacity>

            {logo && (
              <TouchableOpacity
                style={styles.removeLogoButton}
                onPress={() => setLogo(null)}
              >
                <Text style={styles.removeLogoText}>إزالة اللوجو</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>النص السفلي (Footer)</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="مثال: تصميم مقدم د. / رامي ابو الذهب"
                value={footerText}
                onChangeText={setFooterText}
                textAlign="right"
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#fff" />
                  <Text style={styles.saveButtonText}>حفظ الإعدادات</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 16,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
  },
  removeLogoButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  removeLogoText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#99c9ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
