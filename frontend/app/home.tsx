import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';

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

interface User {
  id: string;
  username: string;
  role: string;
}

interface Settings {
  header_text: string;
  footer_text: string;
  logo: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSeniority, setSelectedSeniority] = useState('');
  const [settings, setSettings] = useState<Settings>({
    header_text: 'منطقة شرق الدلتا',
    footer_text: 'تصميم مقدم د. / رامي ابو الذهب',
    logo: null,
  });

  useEffect(() => {
    loadUser();
    loadEmployees();
    loadSectors();
    loadSettings();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, selectedSector, selectedSeniority, employees]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.log('Error loading user:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.log('Error loading employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.assigned_work.toLowerCase().includes(query) ||
          emp.rank.toLowerCase().includes(query)
      );
    }

    if (selectedSector) {
      filtered = filtered.filter((emp) => emp.sector === selectedSector);
    }

    if (selectedSeniority) {
      filtered = filtered.filter((emp) => emp.seniority === selectedSeniority);
    }

    setFilteredEmployees(filtered);
  };

  const handleVoiceSearch = async () => {
    Alert.alert(
      'البحث الصوتي',
      'اضغط موافق وتحدث بوضوح',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'موافق',
          onPress: () => {
            setIsListening(true);
            // In a real app, you'd use a speech-to-text library
            // For now, we'll show a message
            setTimeout(() => {
              setIsListening(false);
              Alert.alert('تنبيه', 'يرجى استخدام البحث الكتابي حالياً');
            }, 2000);
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          router.replace('/');
        },
      },
    ]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEmployees();
    loadSectors();
    loadSettings();
  }, []);

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() => router.push({ pathname: '/employee-details', params: { id: item.id } })}
    >
      <View style={styles.employeeInfo}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.employeePhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Ionicons name="person" size={30} color="#888" />
          </View>
        )}
        <View style={styles.employeeDetails}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeRank}>{item.rank}</Text>
          <Text style={styles.employeeSector}>{item.sector}</Text>
        </View>
      </View>
      <Ionicons name="chevron-back" size={24} color="#888" />
    </TouchableOpacity>
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSector('');
    setSelectedSeniority('');
    setShowFilterModal(false);
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
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            {settings.logo && (
              <Image
                source={{ uri: settings.logo }}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            )}
            <Text style={styles.headerTitle}>{settings.header_text}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={handleVoiceSearch} style={styles.voiceButton}>
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={24}
              color={isListening ? '#ff4444' : '#888'}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم أو العمل..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.filterButton}
          >
            <Ionicons name="filter" size={24} color="#4a90d9" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {canEdit && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-employee')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>إضافة موظف</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() =>
            router.push({
              pathname: '/report',
              params: {
                sector: selectedSector,
                seniority: selectedSeniority,
                search: searchQuery,
              },
            })
          }
        >
          <Ionicons name="document-text" size={20} color="#4a90d9" />
          <Text style={styles.reportButtonText}>تقرير</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>
          عدد النتائج: {filteredEmployees.length}
        </Text>
      </View>

      {/* Employee List */}
      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#888" />
            <Text style={styles.emptyText}>لا يوجد موظفين</Text>
          </View>
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{settings.footer_text}</Text>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>فلترة النتائج</Text>

            <Text style={styles.filterLabel}>القطاع</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedSector && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedSector('')}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !selectedSector && styles.filterOptionTextSelected,
                    ]}
                  >
                    الكل
                  </Text>
                </TouchableOpacity>
                {sectors.map((sector) => (
                  <TouchableOpacity
                    key={sector}
                    style={[
                      styles.filterOption,
                      selectedSector === sector && styles.filterOptionSelected,
                    ]}
                    onPress={() => setSelectedSector(sector)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedSector === sector && styles.filterOptionTextSelected,
                      ]}
                    >
                      {sector}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.filterLabel}>الأقدمية</Text>
            <View style={styles.filterOptions}>
              {['', 'سنة', 'سنتان', '3 سنوات', '5 سنوات', '10 سنوات'].map(
                (seniority, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterOption,
                      selectedSeniority === seniority && styles.filterOptionSelected,
                    ]}
                    onPress={() => setSelectedSeniority(seniority)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedSeniority === seniority &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {seniority || 'الكل'}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>مسح الفلاتر</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>تطبيق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#16213e',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 35,
    height: 35,
    marginLeft: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  voiceButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90d9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    marginRight: 5,
    fontWeight: 'bold',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90d9',
  },
  reportButtonText: {
    color: '#4a90d9',
    marginRight: 5,
    fontWeight: 'bold',
  },
  countText: {
    color: '#888',
    fontSize: 14,
  },
  listContent: {
    padding: 15,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeDetails: {
    marginRight: 12,
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  employeeRank: {
    fontSize: 14,
    color: '#4a90d9',
    textAlign: 'right',
  },
  employeeSector: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  footer: {
    backgroundColor: '#16213e',
    padding: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'right',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  filterOption: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#4a90d9',
  },
  filterOptionText: {
    color: '#fff',
  },
  filterOptionTextSelected: {
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4a90d9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
