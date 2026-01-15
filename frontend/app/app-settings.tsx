import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Settings {
  id: string;
  header_text: string;
  footer_text: string;
  logo: string | null;
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    id: 'app_settings',
    header_text: 'منطقة شرق الدلتا',
    footer_text: 'تصميم مقدم د. / رامي ابو الذهب',
    logo: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('تنبيه', 'يجب منح صلاحية الوصول للصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setSettings({ ...settings, logo: base64Image });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header_text: settings.header_text,
          footer_text: settings.footer_text,
          logo: settings.logo,
        }),
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم حفظ الإعدادات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setSettings({ ...settings, logo: null });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إعدادات التطبيق</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Logo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الشعار</Text>
            <View style={styles.logoContainer}>
              {settings.logo ? (
                <Image source={{ uri: settings.logo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image" size={40} color="#888" />
                </View>
              )}
              <View style={styles.logoButtons}>
                <TouchableOpacity style={styles.logoButton} onPress={pickLogo}>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.logoButtonText}>رفع شعار</Text>
                </TouchableOpacity>
                {settings.logo && (
                  <TouchableOpacity
                    style={[styles.logoButton, styles.removeButton]}
                    onPress={removeLogo}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.logoButtonText}>حذف</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Header Text Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>العنوان الرئيسي</Text>
            <TextInput
              style={styles.input}
              placeholder="منطقة شرق الدلتا"
              placeholderTextColor="#888"
              value={settings.header_text}
              onChangeText={(text) => setSettings({ ...settings, header_text: text })}
              textAlign="right"
            />
          </View>

          {/* Footer Text Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التذييل</Text>
            <TextInput
              style={styles.input}
              placeholder="تصميم مقدم د. / رامي ابو الذهب"
              placeholderTextColor="#888"
              value={settings.footer_text}
              onChangeText={(text) => setSettings({ ...settings, footer_text: text })}
              textAlign="right"
            />
          </View>

          {/* Preview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معاينة</Text>
            <View style={styles.preview}>
              <View style={styles.previewHeader}>
                {settings.logo && (
                  <Image source={{ uri: settings.logo }} style={styles.previewLogo} />
                )}
                <Text style={styles.previewHeaderText}>{settings.header_text}</Text>
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewContentText}>محتوى التطبيق</Text>
              </View>
              <View style={styles.previewFooter}>
                <Text style={styles.previewFooterText}>{settings.footer_text}</Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>حفظ الإعدادات</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoButtons: {
    flexDirection: 'row',
    marginTop: 15,
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90d9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  logoButtonText: {
    color: '#fff',
    marginRight: 8,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  preview: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
    padding: 10,
  },
  previewLogo: {
    width: 30,
    height: 30,
    borderRadius: 5,
    marginLeft: 10,
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewContent: {
    padding: 30,
    alignItems: 'center',
  },
  previewContentText: {
    color: '#888',
    fontSize: 12,
  },
  previewFooter: {
    backgroundColor: '#16213e',
    padding: 8,
    alignItems: 'center',
  },
  previewFooterText: {
    color: '#888',
    fontSize: 10,
  },
  saveButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
