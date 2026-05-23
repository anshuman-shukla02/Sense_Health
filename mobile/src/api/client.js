// Sense Health — API Client
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Change this to your backend URL
// For Web/iOS: http://localhost:5001
// For Android emulator: http://10.0.2.2:5001
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api';
  }
  return 'http://localhost:5001/api';
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ===== Data =====
export const dataAPI = {
  submitLog: (data) => api.post('/data/log', data),
  getLogs: (params) => api.get('/data/logs', { params }),
  getLog: (date) => api.get(`/data/log/${date}`),
  getBaseline: () => api.get('/data/baseline'),
};

// ===== Analysis =====
export const analysisAPI = {
  getRisk: () => api.get('/analysis/risk'),
  getTrends: (days = 14) => api.get('/analysis/trends', { params: { days } }),
  getAlerts: (limit = 10) => api.get('/analysis/alerts', { params: { limit } }),
  getSummary: () => api.get('/analysis/summary'),
  getAIInsights: () => api.get('/analysis/ai-insights'),
};

// ===== Health Check =====
export const healthCheck = () => api.get('/health');

export default api;
