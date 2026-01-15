import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Employee {
  id: string;
  name: string;
  rank: string;
  seniority: string;
  phone: string;
  assigned_work: string;
  sector: string;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export default function EmployeeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    loadEmployee();
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
  };

  const loadEmployee = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployee(data);
      } else {
        Alert.alert('خطأ', 'الموظف غير موجود');
        router.back();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا الموظف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/api/employees/${id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              Alert.alert('نجاح', 'تم حذف الموظف بنجاح');
              router.back();
            } else {
              Alert.alert('خطأ', 'فشل في حذف الموظف');
            }
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
          }
        },
      },
    ]);
  };

  const handleCall = () => {
    if (employee?.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>الموظف غير موجود</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الموظف</Text>
        {canEdit ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          {employee.photo ? (
            <Image source={{ uri: employee.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={60} color="#888" />
            </View>
          )}
          <Text style={styles.name}>{employee.name}</Text>
          <Text style={styles.rank}>{employee.rank}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{employee.sector}</Text>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="business" size={20} color="#4a90d9" />
              <Text style={styles.detailLabel}>القطاع</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{employee.seniority}</Text>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="time" size={20} color="#4a90d9" />
              <Text style={styles.detailLabel}>الأقدمية</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{employee.assigned_work}</Text>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="briefcase" size={20} color="#4a90d9" />
              <Text style={styles.detailLabel}>العمل المسند</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.detailRow} onPress={handleCall}>
            <Text style={[styles.detailValue, styles.phoneValue]}>
              {employee.phone}
            </Text>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="call" size={20} color="#4a90d9" />
              <Text style={styles.detailLabel}>الهاتف</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {canEdit && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                router.push({ pathname: '/add-employee', params: { id: employee.id } })
              }
            >
              <Ionicons name="create" size={20} color="#fff" />
              <Text style={styles.editButtonText}>تعديل البيانات</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  errorText: {
    color: '#fff',
    fontSize: 16,
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
  },
  photoSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#16213e',
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#4a90d9',
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4a90d9',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  rank: {
    fontSize: 16,
    color: '#4a90d9',
    marginTop: 5,
  },
  detailsSection: {
    backgroundColor: '#16213e',
    margin: 15,
    borderRadius: 15,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'left',
  },
  phoneValue: {
    color: '#4a90d9',
    textDecorationLine: 'underline',
  },
  actionSection: {
    padding: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a90d9',
    padding: 15,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
