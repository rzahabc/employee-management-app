import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getEmployee, deleteTask } from '../utils/api';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  start_date?: string;
  due_date?: string;
  priority: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  job_grade: string;
  employee_id: string;
  branch_name?: string;
  photo_base64?: string;
  tasks: Task[];
}

export default function EmployeeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadEmployee();
  }, []);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = await getEmployee(id as string);
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
      Alert.alert('خطأ', 'فشل تحميل بيانات الموظف');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف المهمة "${task.title}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
            await loadEmployee();
            Alert.alert('نجح', 'تم حذف المهمة بنجاح');
          } catch (error: any) {
            Alert.alert('خطأ', error.response?.data?.detail || 'فشل حذف المهمة');
          }
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#999';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'جديدة';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتملة';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return '#007AFF';
      case 'new':
        return '#FF9500';
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الموظف</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          {employee.photo_base64 ? (
            <Image source={{ uri: employee.photo_base64 }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={60} color="#999" />
            </View>
          )}

          <Text style={styles.employeeName}>{employee.name}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الدرجة الوظيفية:</Text>
            <Text style={styles.infoValue}>{employee.job_grade}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الرقم التعريفي:</Text>
            <Text style={styles.infoValue}>{employee.employee_id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>القطاع:</Text>
            <Text style={styles.infoValue}>{employee.branch_name}</Text>
          </View>
        </View>

        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={styles.tasksSectionTitle}>المهام ({employee.tasks.length})</Text>
            {canManage && (
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => router.push(`/add-task?employeeId=${employee.id}`)}
              >
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {employee.tasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Ionicons name="clipboard-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTasksText}>لا توجد مهام مسندة</Text>
            </View>
          ) : (
            employee.tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskBadges}>
                    <View style={[styles.badge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                      <Text style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                        {getPriorityLabel(task.priority)}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                      <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                        {getStatusLabel(task.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}

                {(task.start_date || task.due_date) && (
                  <View style={styles.taskDates}>
                    {task.start_date && (
                      <View style={styles.dateItem}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.dateText}>البداية: {format(new Date(task.start_date), 'yyyy/MM/dd')}</Text>
                      </View>
                    )}
                    {task.due_date && (
                      <View style={styles.dateItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.dateText}>الموعد النهائي: {format(new Date(task.due_date), 'yyyy/MM/dd')}</Text>
                      </View>
                    )}
                  </View>
                )}

                {canManage && (
                  <TouchableOpacity
                    style={styles.deleteTaskButton}
                    onPress={() => handleDeleteTask(task)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    <Text style={styles.deleteTaskText}>حذف</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoPlaceholder: {
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  tasksSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addTaskButton: {
    padding: 4,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTasksText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  taskCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  taskBadges: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  taskDates: {
    marginTop: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  deleteTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  deleteTaskText: {
    fontSize: 14,
    color: '#FF3B30',
    marginRight: 4,
  },
});
