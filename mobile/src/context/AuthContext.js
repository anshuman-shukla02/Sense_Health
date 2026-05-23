// Sense Health — Auth Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSetupPermissions, setHasSetupPermissions] = useState(false);
  const [grantedPermissions, setGrantedPermissions] = useState({ location: false, activity: false, screenTime: false });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedPermissions = await AsyncStorage.getItem('hasSetupPermissions');
      const storedPermsData = await AsyncStorage.getItem('grantedPermissions');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedPermissions === 'true') {
          setHasSetupPermissions(true);
        }
        if (storedPermsData) {
          setGrantedPermissions(JSON.parse(storedPermsData));
        }
      }
    } catch (err) {
      console.log('Error loading auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = res.data;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (data) => {
    try {
      const res = await authAPI.register(data);
      const { token: newToken, user: newUser } = res.data;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('hasSetupPermissions');
    setToken(null);
    setUser(null);
    setHasSetupPermissions(false);
  };

  const completePermissions = async (perms) => {
    await AsyncStorage.setItem('hasSetupPermissions', 'true');
    await AsyncStorage.setItem('grantedPermissions', JSON.stringify(perms));
    setGrantedPermissions(perms);
    setHasSetupPermissions(true);
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      const updatedUser = res.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.log('Error refreshing user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshUser,
        hasSetupPermissions,
        grantedPermissions,
        completePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
