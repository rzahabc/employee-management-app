import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { createTask } from '../utils/api';

export default function AddTaskScreen() {
  const { employeeId } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('new');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان المهمة');
      return;
    }

    if (!canManage) {
      Alert.alert('خطأ', 'ليس لديك صلاحية لإضافة المهام');
      return;
    }

    setSaving(true);
    try {
      const taskData: any = {
        employee_id: employeeId,
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
      };

      // Parse dates if provided
      if (startDate) {
        try {
          const [year, month, day] = startDate.split('/');
          if (year && month && day) {
            taskData.start_date = new Date(`${year}-${month}-${day}`).toISOString();
          }
        } catch (e) {
          console.error('Error parsing start date:', e);
        }
      }

      if (dueDate) {
        try {
          const [year, month, day] = dueDate.split('/');
          if (year && month && day) {
            taskData.due_date = new Date(`${year}-${month}-${day}`).toISOString();
          }
        } catch (e) {
          console.error('Error parsing due date:', e);
        }
      }

      await createTask(taskData);

      Alert.alert('نجح', 'تم إضافة المهمة بنجاح', [
        {
          text: 'موافق',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'فشل إضافة المهمة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة مهمة جديدة</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>عنوان المهمة *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثل: إعداد التقرير الشهري"
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوصف</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="تفاصيل المهمة..."
                value={description}
                onChangeText={setDescription}
                textAlign="right"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>تاريخ البدء (yyyy/mm/dd)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025/01/15"
                value={startDate}
                onChangeText={setStartDate}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الموعد النهائي (yyyy/mm/dd)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025/01/30"
                value={dueDate}
                onChangeText={setDueDate}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الأولوية</Text>
              <View style={styles.optionButtons}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    priority === 'low' && styles.optionButtonActive,
                    priority === 'low' && { backgroundColor: '#34C759' },
                  ]}
                  onPress={() => setPriority('low')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      priority === 'low' && styles.optionButtonTextActive,
                    ]}
                  >
                    منخفضة
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    priority === 'medium' && styles.optionButtonActive,
                    priority === 'medium' && { backgroundColor: '#FF9500' },
                  ]}
                  onPress={() => setPriority('medium')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      priority === 'medium' && styles.optionButtonTextActive,
                    ]}
                  >
                    متوسطة
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    priority === 'high' && styles.optionButtonActive,
                    priority === 'high' && { backgroundColor: '#FF3B30' },
                  ]}
                  onPress={() => setPriority('high')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      priority === 'high' && styles.optionButtonTextActive,
                    ]}
                  >
                    عالية
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الحالة</Text>
              <View style={styles.optionButtons}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    status === 'new' && styles.optionButtonActive,
                    status === 'new' && { backgroundColor: '#FF9500' },
                  ]}
                  onPress={() => setStatus('new')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      status === 'new' && styles.optionButtonTextActive,
                    ]}
                  >
                    جديدة
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    status === 'in_progress' && styles.optionButtonActive,
                    status === 'in_progress' && { backgroundColor: '#007AFF' },
                  ]}
                  onPress={() => setStatus('in_progress')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      status === 'in_progress' && styles.optionButtonTextActive,
                    ]}
                  >
                    قيد التنفيذ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    status === 'completed' && styles.optionButtonActive,
                    status === 'completed' && { backgroundColor: '#34C759' },
                  ]}
                  onPress={() => setStatus('completed')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      status === 'completed' && styles.optionButtonTextActive,
                    ]}
                  >
                    مكتملة
                  </Text>
                </TouchableOpacity>
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
                  <Text style={styles.saveButtonText}>حفظ المهمة</Text>
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextActive: {
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
