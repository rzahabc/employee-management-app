import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Users
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (username: string, password: string, role: string) => {
  const response = await api.post('/users', { username, password, role });
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// Branches
export const getBranches = async () => {
  const response = await api.get('/branches');
  return response.data;
};

export const createBranch = async (name: string) => {
  const response = await api.post('/branches', { name });
  return response.data;
};

export const updateBranch = async (branchId: string, name: string) => {
  const response = await api.put(`/branches/${branchId}`, { name });
  return response.data;
};

export const deleteBranch = async (branchId: string) => {
  const response = await api.delete(`/branches/${branchId}`);
  return response.data;
};

// Employees
export const getEmployees = async () => {
  const response = await api.get('/employees');
  return response.data;
};

export const getEmployee = async (employeeId: string) => {
  const response = await api.get(`/employees/${employeeId}`);
  return response.data;
};

export const createEmployee = async (employeeData: any) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

export const updateEmployee = async (employeeId: string, employeeData: any) => {
  const response = await api.put(`/employees/${employeeId}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (employeeId: string) => {
  const response = await api.delete(`/employees/${employeeId}`);
  return response.data;
};

// Tasks
export const getTasks = async (employeeId?: string) => {
  const url = employeeId ? `/tasks?employee_id=${employeeId}` : '/tasks';
  const response = await api.get(url);
  return response.data;
};

export const createTask = async (taskData: any) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId: string, taskData: any) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId: string) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Search
export const searchEmployees = async (query?: string, branchId?: string, jobGrade?: string) => {
  let url = '/search?';
  if (query) url += `query=${encodeURIComponent(query)}&`;
  if (branchId) url += `branch_id=${branchId}&`;
  if (jobGrade) url += `job_grade=${encodeURIComponent(jobGrade)}&`;
  const response = await api.get(url);
  return response.data;
};

// Export
export const exportToExcel = () => {
  return `${API_URL}/export/excel`;
};

export const exportToPDF = () => {
  return `${API_URL}/export/pdf`;
};

// Settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settingsData: any) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};

export default api;