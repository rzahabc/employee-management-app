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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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
}

interface Settings {
  header_text: string;
  footer_text: string;
  logo: string | null;
}

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sector, seniority, search } = params as {
    sector?: string;
    seniority?: string;
    search?: string;
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<Settings>({
    header_text: 'منطقة شرق الدلتا',
    footer_text: 'تصميم مقدم د. / رامي ابو الذهب',
    logo: null,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load employees with filters
      let url = `${API_URL}/api/employees?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (sector) url += `sector=${encodeURIComponent(sector)}&`;
      if (seniority) url += `seniority=${encodeURIComponent(seniority)}&`;

      const [empResponse, settingsResponse] = await Promise.all([
        fetch(url),
        fetch(`${API_URL}/api/settings`),
      ]);

      if (empResponse.ok) {
        const empData = await empResponse.json();
        setEmployees(empData);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const generateHTML = () => {
    const date = new Date().toLocaleDateString('ar-EG');
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4a90d9;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1a1a2e;
            margin: 0;
          }
          .header .date {
            color: #888;
            font-size: 14px;
            margin-top: 10px;
          }
          .filters {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
          }
          th {
            background-color: #4a90d9;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #888;
            font-size: 12px;
          }
          .count {
            font-weight: bold;
            color: #4a90d9;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.header_text}</h1>
          <div class="date">تاريخ التقرير: ${date}</div>
        </div>
        
        ${(search || sector || seniority) ? `
          <div class="filters">
            <strong>معايير البحث:</strong>
            ${search ? `كلمة البحث: ${search} | ` : ''}
            ${sector ? `القطاع: ${sector} | ` : ''}
            ${seniority ? `الأقدمية: ${seniority}` : ''}
          </div>
        ` : ''}
        
        <p>عدد الموظفين: <span class="count">${employees.length}</span></p>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>الرتبة</th>
              <th>الأقدمية</th>
              <th>الهاتف</th>
              <th>العمل المسند</th>
              <th>القطاع</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map((emp, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${emp.name}</td>
                <td>${emp.rank}</td>
                <td>${emp.seniority}</td>
                <td>${emp.phone}</td>
                <td>${emp.assigned_work}</td>
                <td>${emp.sector}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          ${settings.footer_text}
        </div>
      </body>
      </html>
    `;
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      const newUri = FileSystem.documentDirectory + `report_${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      
      await Sharing.shareAsync(newUri);
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('خطأ', 'فشل في تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  const printReport = async () => {
    try {
      const html = generateHTML();
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('خطأ', 'فشل في طباعة التقرير');
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
        <Text style={styles.headerTitle}>التقرير</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{settings.header_text}</Text>
          <Text style={styles.summarySubtitle}>
            عدد الموظفين: {employees.length}
          </Text>
          {(search || sector || seniority) && (
            <View style={styles.filters}>
              {search && <Text style={styles.filterText}>بحث: {search}</Text>}
              {sector && <Text style={styles.filterText}>قطاع: {sector}</Text>}
              {seniority && <Text style={styles.filterText}>أقدمية: {seniority}</Text>}
            </View>
          )}
        </View>

        {/* Employee List Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>قائمة الموظفين</Text>
          {employees.slice(0, 5).map((emp, index) => (
            <View key={emp.id} style={styles.employeeRow}>
              <Text style={styles.employeeName}>
                {index + 1}. {emp.name}
              </Text>
              <Text style={styles.employeeSector}>{emp.sector}</Text>
            </View>
          ))}
          {employees.length > 5 && (
            <Text style={styles.moreText}>
              ... و {employees.length - 5} موظفين آخرين
            </Text>
          )}
        </View>

        {/* Export Buttons */}
        <View style={styles.exportSection}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={printReport}
          >
            <Ionicons name="print" size={24} color="#fff" />
            <Text style={styles.exportButtonText}>طباعة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, styles.pdfButton]}
            onPress={exportToPDF}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="document" size={24} color="#fff" />
                <Text style={styles.exportButtonText}>تصدير PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  summaryCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#4a90d9',
    marginTop: 10,
  },
  filters: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    width: '100%',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 2,
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
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  employeeName: {
    color: '#fff',
    fontSize: 14,
  },
  employeeSector: {
    color: '#888',
    fontSize: 14,
  },
  moreText: {
    color: '#4a90d9',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  exportSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  pdfButton: {
    backgroundColor: '#4a90d9',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
