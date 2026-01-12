import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getEmployees, deleteEmployee, getBranches, searchEmployees } from '../utils/api';
import Voice from '@react-native-voice/voice';

interface Employee {
  id: string;
  name: string;
  job_grade: string;
  employee_id: string;
  branch_id: string;
  branch_name?: string;
  photo_base64?: string;
  tasks: any[];
}

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadData();
    initVoice();
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, selectedBranch, employees]);

  const initVoice = async () => {
    try {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
    } catch (error) {
      console.error('Error initializing voice:', error);
    }
  };

  const onSpeechStart = () => {
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechResults = (event: any) => {
    if (event.value && event.value.length > 0) {
      const spokenText = event.value[0];
      setSearchQuery(spokenText);
    }
  };

  const onSpeechError = (error: any) => {
    console.error('Speech error:', error);
    setIsListening(false);
    Alert.alert('خطأ', 'فشل التعرف على الصوت. الرجاء المحاولة مرة أخرى');
  };

  const startVoiceSearch = async () => {
    try {
      setIsListening(true);
      await Voice.start('ar-SA'); // Arabic language
    } catch (error) {
      console.error('Error starting voice:', error);
      setIsListening(false);
      Alert.alert('خطأ', 'فشل بدء البحث الصوتي');
    }
  };

  const stopVoiceSearch = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, branchesData] = await Promise.all([
        getEmployees(),
        getBranches(),
      ]);
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('خطأ', 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = async () => {
    try {
      if (!searchQuery && !selectedBranch) {
        setFilteredEmployees(employees);
        return;
      }

      const results = await searchEmployees(
        searchQuery || undefined,
        selectedBranch || undefined,
        undefined
      );
      setFilteredEmployees(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleDelete = (employee: Employee) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف الموظف ${employee.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployee(employee.id);
            await loadData();
            Alert.alert('نجح', 'تم حذف الموظف بنجاح');
          } catch (error: any) {
            Alert.alert('خطأ', error.response?.data?.detail || 'فشل حذف الموظف');
          }
        },
      },
    ]);
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() => router.push(`/employee-details?id=${item.id}`)}
    >
      <View style={styles.cardContent}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeDetails}>
            الدرجة: {item.job_grade} | الرقم: {item.employee_id}
          </Text>
          <Text style={styles.employeeBranch}>القطاع: {item.branch_name}</Text>
          <Text style={styles.employeeTasks}>
            المهام: {item.tasks?.length || 0}
          </Text>
        </View>
        
        {item.photo_base64 && (
          <Image
            source={{ uri: item.photo_base64 }}
            style={styles.employeePhoto}
          />
        )}
        {!item.photo_base64 && (
          <View style={[styles.employeePhoto, styles.employeePhotoPlaceholder]}>
            <Ionicons name="person" size={40} color="#999" />
          </View>
        )}
      </View>

      {canManage && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/edit-employee?id=${item.id}`);
            }}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>الأسماء</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TouchableOpacity 
            onPress={isListening ? stopVoiceSearch : startVoiceSearch}
            style={styles.voiceButton}
          >
            <Ionicons 
              name={isListening ? "mic" : "mic-outline"} 
              size={24} 
              color={isListening ? "#FF3B30" : "#007AFF"} 
            />
          </TouchableOpacity>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isListening ? "جاري الاستماع..." : "البحث بالاسم أو الرقم التعريفي..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
            editable={!isListening}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, !selectedBranch && styles.filterButtonActive]}
            onPress={() => setSelectedBranch('')}
          >
            <Text style={[styles.filterButtonText, !selectedBranch && styles.filterButtonTextActive]}>
              الكل
            </Text>
          </TouchableOpacity>
          {branches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              style={[
                styles.filterButton,
                selectedBranch === branch.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedBranch(branch.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedBranch === branch.id && styles.filterButtonTextActive,
                ]}
              >
                {branch.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا يوجد أسماء</Text>
          </View>
        }
      />

      {canManage && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-employee')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  voiceButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'right',
  },
  employeeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    textAlign: 'right',
  },
  employeeBranch: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
    textAlign: 'right',
  },
  employeeTasks: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'right',
  },
  employeePhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  employeePhotoPlaceholder: {
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: 8,
    marginLeft: 16,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});