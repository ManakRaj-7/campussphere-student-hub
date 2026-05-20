import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authLogin, authRegister, authGetMe } from '../services/api';
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
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authGetMe();
        setUser(response.data?.user || response.data);
        setToken(savedToken);
      } catch (error) {
        console.warn('Token validation failed:', error);
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
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('campussphere-token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name || 'User'}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await authRegister(data);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('campussphere-token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
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
