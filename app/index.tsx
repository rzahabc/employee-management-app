import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { login as apiLogin } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const userData = await apiLogin(username, password);
      await login(userData);
      router.replace('/home');
    } catch (error: any) {
      Alert.alert(
        'خطأ في تسجيل الدخول',
        error.response?.data?.detail || 'اسم المستخدم أو كلمة المرور غير صحيحة'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="people" size={80} color="#007AFF" />
          <Text style={styles.title}>إدارة الموظفين</Text>
          <Text style={styles.subtitle}>تسجيل الدخول</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="اسم المستخدم"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.inputIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>نظام إدارة بيانات الموظفين</Text>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1A1A1A',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#99c9ff',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
});