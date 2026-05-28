import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authLogin, authRegister, authGetMe, isApiConfigured } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('campussphere-token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem('campussphere-token');
      // If the frontend was built without an API URL, notify the user
      if (!isApiConfigured()) {
        toast.error('VITE_API_URL is not configured. Set VITE_API_URL in Vercel environment variables to point to your Render backend.');
        setLoading(false);
        return;
      }
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authGetMe();
        const userData = response.data?.data?.user || response.data?.user || response.data;
        setUser(userData);
        setToken(savedToken);
      } catch (error) {
        // Network or server error while validating token
        console.warn('Token validation failed:', error);
        if (!error.response) {
          toast.error('Network error: Unable to reach backend. Check VITE_API_URL and backend availability.');
        }
        localStorage.removeItem('campussphere-token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authLogin({ email, password });
      const apiData = response.data?.data || response.data || {};
      const { token: newToken, user: userData } = apiData;
      
      if (!newToken || !userData) {
        throw new Error('Invalid response structure from authentication server');
      }

      localStorage.setItem('campussphere-token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name || 'User'}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await authRegister(data);
      const apiData = response.data?.data || response.data || {};
      const { token: newToken, user: userData } = apiData;

      if (!newToken || !userData) {
        throw new Error('Invalid response structure from registration server');
      }
      
      localStorage.setItem('campussphere-token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('campussphere-token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  }), [user, token, loading, login, register, logout, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
