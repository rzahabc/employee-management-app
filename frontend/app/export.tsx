import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Employee {
  id: string;
  name: string;
  rank: string;
  seniority: string;
  phone: string;
  assigned_work: string;
  sector: string;
}

export default function ExportScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Create CSV content
      const headers = 'الاسم,الرتبة,الأقدمية,الهاتف,العمل المسند,القطاع';
      const rows = employees.map(
        (emp) =>
          `${emp.name},${emp.rank},${emp.seniority},${emp.phone},${emp.assigned_work},${emp.sector}`
      );
      const csvContent = [headers, ...rows].join('\n');

      // Add BOM for Arabic support in Excel
      const bom = '\uFEFF';
      const csvWithBom = bom + csvContent;

      const fileName = `employees_${Date.now()}.csv`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, csvWithBom, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('خطأ', 'فشل في تصدير البيانات');
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = async () => {
    setExporting(true);
    try {
      const jsonContent = JSON.stringify(employees, null, 2);
      const fileName = `employees_${Date.now()}.json`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('خطأ', 'فشل في تصدير البيانات');
    } finally {
      setExporting(false);
    }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تصدير البيانات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={40} color="#4a90d9" />
          <Text style={styles.infoTitle}>تصدير بيانات الموظفين</Text>
          <Text style={styles.infoText}>
            عدد الموظفين: {employees.length}
          </Text>
          <Text style={styles.infoSubtext}>
            يمكنك تصدير البيانات بصيغة CSV (للفتح في Excel) أو JSON
          </Text>
        </View>

        {/* Export Options */}
        <View style={styles.exportOptions}>
          <TouchableOpacity
            style={styles.exportCard}
            onPress={exportToCSV}
            disabled={exporting || employees.length === 0}
          >
            <View style={[styles.exportIcon, { backgroundColor: '#27ae60' }]}>
              <Ionicons name="document-text" size={30} color="#fff" />
            </View>
            <Text style={styles.exportTitle}>CSV / Excel</Text>
            <Text style={styles.exportDesc}>
              تصدير للفتح في برامج جداول البيانات
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportCard}
            onPress={exportToJSON}
            disabled={exporting || employees.length === 0}
          >
            <View style={[styles.exportIcon, { backgroundColor: '#e67e22' }]}>
              <Ionicons name="code" size={30} color="#fff" />
            </View>
            <Text style={styles.exportTitle}>JSON</Text>
            <Text style={styles.exportDesc}>
              تصدير للمطورين والنسخ الاحتياطي
            </Text>
          </TouchableOpacity>
        </View>

        {exporting && (
          <View style={styles.exportingContainer}>
            <ActivityIndicator size="large" color="#4a90d9" />
            <Text style={styles.exportingText}>جاري التصدير...</Text>
          </View>
        )}

        {employees.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={40} color="#ff4444" />
            <Text style={styles.emptyText}>لا توجد بيانات للتصدير</Text>
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
  infoCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#4a90d9',
    marginTop: 10,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  exportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  exportIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  exportDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  exportingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  exportingText: {
    color: '#4a90d9',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
  },
  emptyText: {
    color: '#ff4444',
    marginTop: 10,
    fontSize: 16,
  },
});
