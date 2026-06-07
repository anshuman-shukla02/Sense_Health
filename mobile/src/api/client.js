// Sense Health — API Client
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Change this to your backend URL
// For Web/iOS Simulator: http://localhost:5001 (Recommended, router-independent)
// For Physical Mobile Devices on Wifi: http://10.180.190.92:5001
// For Android emulator: http://10.0.2.2:5001
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api'; // Android Emulator Bridge
  }
  // iOS Simulator and Web use localhost to connect to the host machine.
  // For physical devices on Wi-Fi, replace 'localhost' with your machine's local IP.
  return 'http://localhost:5001/api';
};

const BASE_URL = getBaseUrl();
console.log('[API Client] Initialized. Base URL is:', BASE_URL);

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
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response Success] ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status ${error.response?.status || 'network_error'} - Message:`, error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  saveGeminiKey: (apiKey) => api.put('/auth/gemini-key', { apiKey }),
  getGeminiKey: () => api.get('/auth/gemini-key'),
};

// ===== Data =====
export const dataAPI = {
  submitLog: (data) => api.post('/data/log', data),
  getLogs: (params) => api.get('/data/logs', { params }),
  getLog: (date) => api.get(`/data/log/${date}`),
  getBaseline: () => api.get('/data/baseline'),
  submitGameResult: (data) => api.post('/data/game', data),
  getGameHistory: () => api.get('/data/game/history'),
};

// ===== Analysis =====
export const analysisAPI = {
  getRisk: () => api.get('/analysis/risk'),
  getTrends: (days = 14) => api.get('/analysis/trends', { params: { days } }),
  getAlerts: (limit = 10) => api.get('/analysis/alerts', { params: { limit } }),
  getSummary: () => api.get('/analysis/summary'),
  getAIInsights: () => api.get('/analysis/ai-insights', { timeout: 30000 }),
  askCoach: (question, history) => api.post('/analysis/chat', { question, history }, { timeout: 30000 }),
};

// ===== Health Check =====
export const healthCheck = () => api.get('/health');

export default api;
