import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Sector {
  id: string;
  name: string;
  created_at: string;
}

export default function ManageSectorsScreen() {
  const router = useRouter();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorName, setSectorName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sectors`);
      if (response.ok) {
        const data = await response.json();
        setSectors(data);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل القطاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sectorName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم القطاع');
      return;
    }

    setSaving(true);
    try {
      const url = editingSector
        ? `${API_URL}/api/sectors/${editingSector.id}`
        : `${API_URL}/api/sectors`;

      const response = await fetch(url, {
        method: editingSector ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: sectorName.trim() }),
      });

      if (response.ok) {
        Alert.alert('نجاح', editingSector ? 'تم تحديث القطاع' : 'تم إضافة القطاع');
        closeModal();
        loadSectors();
      } else {
        const data = await response.json();
        Alert.alert('خطأ', data.detail || 'فشل في حفظ القطاع');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sector: Sector) => {
    Alert.alert('تأكيد الحذف', `هل أنت متأكد من حذف ${sector.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/api/sectors/${sector.id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              Alert.alert('نجاح', 'تم حذف القطاع');
              loadSectors();
            }
          } catch (error) {
            Alert.alert('خطأ', 'فشل في حذف القطاع');
          }
        },
      },
    ]);
  };

  const openEditModal = (sector: Sector) => {
    setEditingSector(sector);
    setSectorName(sector.name);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingSector(null);
    setSectorName('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSector(null);
    setSectorName('');
  };

  const renderSector = ({ item }: { item: Sector }) => (
    <View style={styles.sectorCard}>
      <View style={styles.sectorInfo}>
        <Ionicons name="business" size={24} color="#4a90d9" />
        <Text style={styles.sectorName}>{item.name}</Text>
      </View>
      <View style={styles.sectorActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={22} color="#4a90d9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={22} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>إدارة القطاعات</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add" size={28} color="#4a90d9" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sectors}
        renderItem={renderSector}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={60} color="#888" />
            <Text style={styles.emptyText}>لا يوجد قطاعات</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSector ? 'تعديل القطاع' : 'إضافة قطاع جديد'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="اسم القطاع"
              placeholderTextColor="#888"
              value={sectorName}
              onChangeText={setSectorName}
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
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
  listContent: {
    padding: 15,
  },
  sectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  sectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
  },
  sectorActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4a90d9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
