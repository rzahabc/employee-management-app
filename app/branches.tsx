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
import { getBranches, createBranch, updateBranch, deleteBranch } from '../utils/api';

interface Branch {
  id: string;
  name: string;
  created_at: string;
}

export default function BranchesScreen() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
      Alert.alert('خطأ', 'فشل تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!branchName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم الفرع');
      return;
    }

    setSaving(true);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, branchName);
        Alert.alert('نجح', 'تم تحديث الفرع بنجاح');
      } else {
        await createBranch(branchName);
        Alert.alert('نجح', 'تم إضافة الفرع بنجاح');
      }
      setModalVisible(false);
      setBranchName('');
      setEditingBranch(null);
      await loadBranches();
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'فشل حفظ الفرع');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setModalVisible(true);
  };

  const handleDelete = (branch: Branch) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف الفرع ${branch.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBranch(branch.id);
            await loadBranches();
            Alert.alert('نجح', 'تم حذف الفرع بنجاح');
          } catch (error: any) {
            Alert.alert('خطأ', error.response?.data?.detail || 'فشل حذف الفرع');
          }
        },
      },
    ]);
  };

  const renderBranch = ({ item }: { item: Branch }) => (
    <View style={styles.branchCard}>
      <View style={styles.branchInfo}>
        <View style={styles.branchIconContainer}>
          <Ionicons name="business" size={24} color="#34C759" />
        </View>
        <Text style={styles.branchName}>{item.name}</Text>
      </View>

      {canManage && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>القطاعات</Text>
      </View>

      <FlatList
        data={branches}
        renderItem={renderBranch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا يوجد قطاعات</Text>
          </View>
        }
      />

      {canManage && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setEditingBranch(null);
            setBranchName('');
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBranch ? 'تعديل القطاع' : 'إضافة قطاع جديد'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="اسم القطاع"
              value={branchName}
              onChangeText={setBranchName}
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setBranchName('');
                  setEditingBranch(null);
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
  branchCard: {
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
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C75915',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'right',
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
    backgroundColor: '#34C759',
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
    marginBottom: 20,
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
    backgroundColor: '#34C759',
  },
  saveButtonDisabled: {
    backgroundColor: '#99e3b3',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});