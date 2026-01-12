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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getBranches, getEmployee, updateEmployee } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';

interface Branch {
  id: string;
  name: string;
}

export default function EditEmployeeScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [jobGrade, setJobGrade] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!canManage) {
      router.back();
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeeData, branchesData] = await Promise.all([
        getEmployee(id as string),
        getBranches(),
      ]);

      setName(employeeData.name);
      setJobGrade(employeeData.job_grade);
      setEmployeeId(employeeData.employee_id);
      setSelectedBranch(employeeData.branch_id);
      setPhoto(employeeData.photo_base64);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('خطأ', 'فشل تحميل بيانات الموظف');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  };

  const takePhoto = async () => {
    const hasPermissions = await requestPermissions();
    
    if (!hasPermissions) {
      Alert.alert('خطأ', 'يتطلب التطبيق أذونات الكاميرا والمعرض');
      return;
    }

    Alert.alert('تغيير الصورة', 'اختر الطريقة', [
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
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim() || !jobGrade.trim() || !employeeId.trim() || !selectedBranch) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات المطلوبة');
      return;
    }

    setSaving(true);
    try {
      await updateEmployee(id as string, {
        name: name.trim(),
        job_grade: jobGrade.trim(),
        employee_id: employeeId.trim(),
        branch_id: selectedBranch,
        photo_base64: photo,
      });

      Alert.alert('نجح', 'تم تحديث بيانات الموظف بنجاح', [
        {
          text: 'موافق',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'فشل تحديث بيانات الموظف');
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
        <Text style={styles.headerTitle}>تعديل بيانات الموظف</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.photoContainer} onPress={takePhoto}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={48} color="#999" />
                <Text style={styles.photoPlaceholderText}>إضافة صورة</Text>
              </View>
            )}
          </TouchableOpacity>

          {photo && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhoto(null)}
            >
              <Text style={styles.removePhotoText}>إزالة الصورة</Text>
            </TouchableOpacity>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الاسم *</Text>
              <TextInput
                style={styles.input}
                placeholder="اسم الموظف"
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الدرجة الوظيفية *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثل: مدير، موظف، محاسب"
                value={jobGrade}
                onChangeText={setJobGrade}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الرقم التعريفي *</Text>
              <TextInput
                style={styles.input}
                placeholder="الرقم التعريفي للموظف"
                value={employeeId}
                onChangeText={setEmployeeId}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>القطاع/الفرع *</Text>
              <View style={styles.branchButtons}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.branchButton,
                      selectedBranch === branch.id && styles.branchButtonActive,
                    ]}
                    onPress={() => setSelectedBranch(branch.id)}
                  >
                    <Text
                      style={[
                        styles.branchButtonText,
                        selectedBranch === branch.id && styles.branchButtonTextActive,
                      ]}
                    >
                      {branch.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                  <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
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
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  removePhotoButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  removePhotoText: {
    color: '#FF3B30',
    fontSize: 14,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  branchButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  branchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  branchButtonActive: {
    backgroundColor: '#007AFF',
  },
  branchButtonText: {
    fontSize: 14,
    color: '#666',
  },
  branchButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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