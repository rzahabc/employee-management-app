import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string;
  const isEditing = !!editId;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [sectors, setSectors] = useState<string[]>([]);
  const [userRole, setUserRole] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    seniority: '',
    phone: '',
    assigned_work: '',
    sector: '',
    photo: null as string | null,
  });

  useEffect(() => {
    loadUserRole();
    loadSectors();
    if (isEditing) {
      loadEmployee();
    }
  }, []);

  const loadUserRole = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
  };

  const loadSectors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sectors`);
      if (response.ok) {
        const data = await response.json();
        setSectors(data.map((s: any) => s.name));
      }
    } catch (error) {
      console.log('Error loading sectors:', error);
    }
  };

  const loadEmployee = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${editId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          rank: data.rank,
          seniority: data.seniority,
          phone: data.phone,
          assigned_work: data.assigned_work,
          sector: data.sector,
          photo: data.photo,
        });
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل بيانات الموظف');
    } finally {
      setLoadingData(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('تنبيه', 'يجب منح صلاحية الوصول للكاميرا/الصور');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData({ ...formData, photo: base64Image });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الموظف');
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `${API_URL}/api/employees/${editId}`
        : `${API_URL}/api/employees`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert('نجاح', isEditing ? 'تم تحديث الموظف بنجاح' : 'تم إضافة الموظف بنجاح');
        router.back();
      } else {
        const data = await response.json();
        Alert.alert('خطأ', data.detail || 'فشل في حفظ البيانات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
          <Text style={styles.headerTitle}>
            {isEditing ? 'تعديل موظف' : 'إضافة موظف جديد'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <View style={styles.photoSection}>
            {formData.photo ? (
              <Image source={{ uri: formData.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color="#888" />
              </View>
            )}
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage(true)}
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.photoButtonText}>الكاميرا</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage(false)}
              >
                <Ionicons name="images" size={20} color="#fff" />
                <Text style={styles.photoButtonText}>الصور</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.label}>الاسم *</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم الموظف"
              placeholderTextColor="#888"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              textAlign="right"
            />

            <Text style={styles.label}>الرتبة</Text>
            <TextInput
              style={styles.input}
              placeholder="رتبة الموظف"
              placeholderTextColor="#888"
              value={formData.rank}
              onChangeText={(text) => setFormData({ ...formData, rank: text })}
              textAlign="right"
            />

            <Text style={styles.label}>الأقدمية</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: 5 سنوات"
              placeholderTextColor="#888"
              value={formData.seniority}
              onChangeText={(text) => setFormData({ ...formData, seniority: text })}
              textAlign="right"
            />

            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput
              style={styles.input}
              placeholder="رقم الهاتف"
              placeholderTextColor="#888"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              textAlign="right"
            />

            <Text style={styles.label}>العمل المسند</Text>
            <TextInput
              style={styles.input}
              placeholder="العمل المسند للموظف"
              placeholderTextColor="#888"
              value={formData.assigned_work}
              onChangeText={(text) => setFormData({ ...formData, assigned_work: text })}
              textAlign="right"
            />

            <Text style={styles.label}>القطاع</Text>
            <View style={styles.sectorContainer}>
              {sectors.map((sector) => (
                <TouchableOpacity
                  key={sector}
                  style={[
                    styles.sectorOption,
                    formData.sector === sector && styles.sectorOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, sector })}
                >
                  <Text
                    style={[
                      styles.sectorOptionText,
                      formData.sector === sector && styles.sectorOptionTextSelected,
                    ]}
                  >
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'تحديث' : 'حفظ'}
              </Text>
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
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    marginTop: 15,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  photoButtonText: {
    color: '#fff',
    marginRight: 8,
  },
  formSection: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  sectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectorOption: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
    marginBottom: 8,
  },
  sectorOptionSelected: {
    backgroundColor: '#4a90d9',
  },
  sectorOptionText: {
    color: '#fff',
  },
  sectorOptionTextSelected: {
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
