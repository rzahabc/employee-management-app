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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getUsers, createUser, deleteUser } from '../utils/api';

interface User {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      router.back();
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('خطأ', 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات');
      return;
    }

    setSaving(true);
    try {
      await createUser(username, password, role);
      Alert.alert('نجح', 'تم إضافة المستخدم بنجاح');
      setModalVisible(false);
      setUsername('');
      setPassword('');
      setRole('user');
      await loadUsers();
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'فشل إضافة المستخدم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert('خطأ', 'لا يمكنك حذف حسابك الحالي');
      return;
    }

    Alert.alert('تأكيد الحذف', `هل تريد حذف المستخدم ${user.username}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(user.id);
            await loadUsers();
            Alert.alert('نجح', 'تم حذف المستخدم بنجاح');
          } catch (error: any) {
            Alert.alert('خطأ', error.response?.data?.detail || 'فشل حذف المستخدم');
          }
        },
      },
    ]);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير نظام';
      case 'manager':
        return 'مدير';
      case 'user':
        return 'مستخدم';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#FF3B30';
      case 'manager':
        return '#007AFF';
      case 'user':
        return '#34C759';
      default:
        return '#999';
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={[styles.userIconContainer, { backgroundColor: getRoleColor(item.role) + '15' }]}>
          <Ionicons name="person" size={24} color={getRoleColor(item.role)} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={[styles.userRole, { color: getRoleColor(item.role) }]}>
            {getRoleLabel(item.role)}
          </Text>
        </View>
      </View>

      {item.id !== currentUser?.id && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
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
        <Text style={styles.headerTitle}>إدارة المستخدمين</Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا يوجد مستخدمين</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setUsername('');
          setPassword('');
          setRole('user');
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إضافة مستخدم جديد</Text>

            <TextInput
              style={styles.input}
              placeholder="اسم المستخدم"
              value={username}
              onChangeText={setUsername}
              textAlign="right"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              textAlign="right"
              secureTextEntry
            />

            <Text style={styles.label}>الدور</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>
                  مدير نظام
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'manager' && styles.roleButtonActive]}
                onPress={() => setRole('manager')}
              >
                <Text style={[styles.roleButtonText, role === 'manager' && styles.roleButtonTextActive]}>
                  مدير
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
                onPress={() => setRole('user')}
              >
                <Text style={[styles.roleButtonText, role === 'user' && styles.roleButtonTextActive]}>
                  مستخدم
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setUsername('');
                  setPassword('');
                  setRole('user');
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>حفظ</Text>
                )}
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
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'right',
  },
  userRole: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
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
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'right',
  },
  roleButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF9500',
  },
  saveButtonDisabled: {
    backgroundColor: '#ffcb80',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});