import React, { createContext, useState, useEffect } from 'react';
import { api, getProfile } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await getProfile();
      console.log('Fetched profile:', profile);
      // Derive firstName and lastName from name
      const nameParts = profile.name ? profile.name.trim().split(' ') : [];
      return {
        ...profile,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        referralCode: profile.referralCode || '',
        preferredPaymentMethod: profile.preferredPaymentMethod || '',
        paymentDetails: profile.paymentDetails || {}, // Added paymentDetails
        hasPaidVerificationFee: profile.hasPaidVerificationFee || false,
        twoFactorEnabled: profile.twoFactorEnabled || false,
        termsAccepted: profile.termsAccepted || false,
      };
    } catch (error) {
      console.error('Profile fetch error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return null;
    }
  };
//modified
 const checkSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        setLoading(false);
        return;
      }
      console.log('Checking session with token:', token.slice(0, 20) + '...');
      const response = await api.get('/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      console.log('Session check response:', response.data);
      // Fetch full profile
      const profile = await fetchProfile();
      if (profile) {
        setUser(profile);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Session check error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password, twoFactorCode) => {
    try {
      const response = await api.post('/api/auth/login', {
        usernameOrEmail: email,
        password,
        twoFactorCode,
      });
      console.log('Login response:', response.data); // Log raw response for debugging
    if (response.data.message === '2fa_required') {
      // Return 2FA requirement details without attempting to access token
      return {
        requires2FA: true,
        user: response.data.user, // Contains id and requires2FA
      };
    }
      const { token, user: loginUser } = response.data;
      console.log('Login response:', { token: token.slice(0, 20) + '...', user: loginUser });
      localStorage.setItem('token', token);
      // Fetch full profile
      const profile = await fetchProfile();
      if (profile) {
        setUser(profile);
        return { token, user: profile };
      } else {
        throw new Error('Failed to fetch profile after login');
      }
    } catch (error) {
      console.error('Login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
      throw error;
    }
  };
//end of fix
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        console.log('Logout successful');
      }
    } catch (error) {
      console.error('Logout failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = async () => {
    const profile = await fetchProfile();
    if (profile) {
      setUser(profile);
      console.log('User updated:', profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};