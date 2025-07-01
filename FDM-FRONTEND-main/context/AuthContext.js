import React, { useContext, createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import API_BASE_URL from '../config/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [donationUpdateTrigger, setDonationUpdateTrigger] = useState(0);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

  // Load user and token from storage on app start
  useEffect(() => {
    console.log('[AuthContext] App start: loading user and token from storage...');
    loadUserFromStorage();
  }, []);

  // Set up axios interceptor for automatic token handling
  useEffect(() => {
    console.log('[AuthContext] Setting up axios interceptor. Token:', token);
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token && token.token) {
          config.headers.Authorization = `Bearer ${token.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Show spinner only if loading takes longer than 500ms
  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => setShowLoadingSpinner(true), 500);
    } else {
      setShowLoadingSpinner(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const loadUserFromStorage = async () => {
    try {
      const [userData, tokenData] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token')
      ]);
      console.log('[AuthContext] Loaded from storage:', { userData, tokenData });
      if (userData && tokenData) {
        const parsedUser = JSON.parse(userData);
        const parsedToken = JSON.parse(tokenData);
        console.log('[AuthContext] Parsed user/token:', { parsedUser, parsedToken });
        // Check if token is expired
        if (isTokenExpired(parsedToken)) {
          console.log('[AuthContext] Token expired. Clearing storage.');
          await clearStorage();
          setIsLoading(false);
          return;
        }
        // Verify token with server
        const isValid = await verifyTokenWithServer(parsedToken);
        if (isValid) {
          setUser(parsedUser);
          setToken(parsedToken);
          setIsTokenValid(true);
        } else {
          console.log('[AuthContext] Token invalid. Clearing storage.');
          await clearStorage();
        }
      }
    } catch (error) {
      console.log('[AuthContext] Error loading user from storage:', error);
      await clearStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const isTokenExpired = (tokenData) => {
    if (!tokenData || !tokenData.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    const expired = currentTime >= tokenData.exp;
    if (expired) console.log('[AuthContext] Token is expired:', tokenData);
    return expired;
  };

  const verifyTokenWithServer = async (tokenData) => {
    try {
      console.log('[AuthContext] Verifying token with server:', tokenData.token);
      const response = await axios.post(`${API_BASE_URL}/auth/verify-token`, {}, {
        headers: {
          Authorization: `Bearer ${tokenData.token}`
        }
      });
      console.log('[AuthContext] Token verification response:', response.data);
      return response.data.success;
    } catch (error) {
      console.log('[AuthContext] Token verification failed:', error.response?.data || error.message);
      return false;
    }
  };

  const clearStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('token')
      ]);
      setUser(null);
      setToken(null);
      setIsTokenValid(false);
      console.log('[AuthContext] Cleared user/token from storage.');
    } catch (error) {
      console.log('[AuthContext] Error clearing storage:', error);
    }
  };

  const login = async (userData, authToken) => {
    try {
      // Store token with expiration info
      const tokenData = {
        token: authToken,
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        iat: Math.floor(Date.now() / 1000)
      };
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(userData)),
        AsyncStorage.setItem('token', JSON.stringify(tokenData))
      ]);
      setUser(userData);
      setToken(tokenData);
      setIsTokenValid(true);
      console.log('[AuthContext] User logged in and token saved:', { userData, tokenData });
    } catch (error) {
      console.log('[AuthContext] Error saving user to storage:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        try {
          await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            headers: {
              Authorization: `Bearer ${token.token}`
            }
          });
        } catch (error) {
          console.log('Logout API call failed:', error);
          // Continue with local logout even if API call fails
        }
      }

      await clearStorage();
    } catch (error) {
      console.log('Error during logout:', error);
      // Force clear storage even if there's an error
      await clearStorage();
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) {
        throw new Error('No token to refresh');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (response.data.success) {
        const newTokenData = {
          token: response.data.token,
          exp: Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60), // 2 days from now
          iat: Math.floor(Date.now() / 1000)
        };

        await AsyncStorage.setItem('token', JSON.stringify(newTokenData));
        setToken(newTokenData);
        setIsTokenValid(true);
        return true;
      }
    } catch (error) {
      console.log('Token refresh failed:', error);
      // If refresh fails, logout the user
      await logout();
      return false;
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
    } catch (error) {
      console.log('Error updating user in storage:', error);
    }
  };

  // Check token validity periodically
  useEffect(() => {
    if (token && isTokenValid) {
      const checkTokenInterval = setInterval(async () => {
        if (isTokenExpired(token)) {
          // Try to refresh token
          const refreshed = await refreshToken();
          if (!refreshed) {
            // If refresh fails, show logout alert
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please log in again.',
              [
                {
                  text: 'OK',
                  onPress: () => logout()
                }
              ]
            );
          }
        }
      }, 60000); // Check every minute

      return () => clearInterval(checkTokenInterval);
    }
  }, [token, isTokenValid]);

  // Function to trigger donation updates across the app
  const triggerDonationUpdate = () => {
    setDonationUpdateTrigger(prev => prev + 1);
  };

  const value = {
    user,
    setUser,
    token,
    isLoading,
    isTokenValid,
    login,
    logout,
    updateUser,
    refreshToken,
    donationUpdateTrigger,
    triggerDonationUpdate,
    showLoadingSpinner,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};