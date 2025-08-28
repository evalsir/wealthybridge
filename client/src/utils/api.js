// frontend/src/utils/api.js
import axios from 'axios';
import { t } from 'i18next';

// Use environment variable for API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL:  'https://59fb26a85ea6.ngrok-free.app', //for testing, https://api.yourdomain.com for production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to include JWT token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Check User Status for Signup
export const checkUserStatus = async (data) => {
  console.log('checkUserStatus request:', data);
  try {
    const response = await api.post('/api/auth/check-user', data, {
      withCredentials: true,
    });
    console.log('checkUserStatus response:', response.data);
    return response;
  } catch (error) {
    console.error('checkUserStatus error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to check user status' };
  }
};

// Signup
export const SignupPage = async (data) => {
  console.log('SignupPage request:', data);
  try {
    const response = await api.post('/api/auth/signup', data, {
      // Changed from /register to /signup to match backend
      withCredentials: true,
    });
    console.log('SignupPage response:', response.data);
    return response;
  } catch (error) {
    console.error('SignupPage error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Signup failed' };
  }
};

// Verify Email OTP
export const VerifyEmailOTP = async (data) => {
  const payload = {
    email: data.email,
    code: String(data.code).trim(),
  };
  console.log('VerifyEmailOTP request:', payload);
  try {
    const response = await api.post('/api/auth/verify-otps', payload, {
      // Changed to match backend route
      withCredentials: true,
    });
    console.log('VerifyEmailOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('VerifyEmailOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Email OTP verification failed' };
  }
};

// Verify Phone OTP
export const VerifyPhoneOTP = async (data) => {
  const payload = {
    phone: data.phone,
    countryCode: data.countryCode,
    code: String(data.code).trim(),
  };
  console.log('VerifyPhoneOTP request:', payload);
  try {
    const response = await api.post('/api/auth/verify-otps', payload, {
      // Changed to match backend route
      withCredentials: true,
    });
    console.log('VerifyPhoneOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('VerifyPhoneOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Phone OTP verification failed' };
  }
};

// Resend Email OTP
export const ResendEmailOTP = async (data) => {
  const payload = {
    email: data.email,
    userId: data.userId,
  };
  console.log('ResendEmailOTP request:', payload);
  try {
    const response = await api.post('/api/auth/resend-email-otp', payload, {
      withCredentials: true,
    });
    console.log('ResendEmailOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('ResendEmailOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to resend email OTP' };
  }
};

// Resend Phone OTP
export const ResendPhoneOTP = async (data) => {
  const payload = {
    phone: data.phone,
    countryCode: data.countryCode,
    userId: data.userId,
  };
  console.log('ResendPhoneOTP request:', payload);
  try {
    const response = await api.post('/api/auth/resend-phone-otp', payload, {
      withCredentials: true,
    });
    console.log('ResendPhoneOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('ResendPhoneOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to resend phone OTP' };
  }
};

// Setup 2FA
export const setup2FA = async (data) => {
  const payload = {
    userId: data.userId,
    enable: data.enable || true,
    code: String(data.code).trim(),
  };
  console.log('setup2FA request:', payload);
  try {
    const response = await api.post('/api/auth/setup-2fa', payload, {
      withCredentials: true,
    });
    console.log('setup2FA response:', response.data);
    return response;
  } catch (error) {
    console.error('setup2FA error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to setup 2FA' };
  }
};

// Resend 2FA OTP
export const resend2FAOTP = async (data) => {
  const payload = {
    userId: data.userId,
  };
  console.log('resend2FAOTP request:', payload);
  try {
    const response = await api.post('/api/auth/resend-2fa-otp', payload, {
      withCredentials: true,
    });
    console.log('resend2FAOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('resend2FAOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to resend 2FA OTP' };
  }
};

// Process Verification Payment
export const processVerificationPayment = async (method, data) => {
  console.log(`processVerificationPayment request for ${method}:`, data);
  try {
    const endpoint = method.startsWith('callback/')
      ? `/api/payments/${method}`
      : `/api/payments/process`; // Match backend route
    const response = await api.post(endpoint, data, {
      withCredentials: true,
      timeout: 60000,
    });
    console.log(`processVerificationPayment response for ${method}:`, response.data);
    return response;
  } catch (error) {
    console.error(`processVerificationPayment error for ${method}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Payment processing failed for ${method}` };
  }
};

// Login
export const loginUser = async (data) => {
  console.log('loginUser request:', data);
  try {
    const response = await api.post('/api/auth/login', data, {
      withCredentials: true,
    });
    console.log('loginUser response:', response.data);
    localStorage.setItem('token', response.data.token);
    return response;
  } catch (error) {
    console.error('loginUser error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Login failed' };
  }
};

// Verify 2FA
export const verify2FA = async (data) => {
  console.log('verify2FA request:', data);
  try {
    const response = await api.post('/api/auth/verify-2fa', data, {
      withCredentials: true,
    });
    console.log('verify2FA response:', response.data);
    return response;
  } catch (error) {
    console.error('verify2FA error:', error.response?.data || error.message);
    throw error.response?.data || { error: '2FA verification failed' };
  }
};

// Enable 2FA
export const enable2FA = async () => {
  console.log('enable2FA request');
  try {
    const response = await api.post('/api/auth/enable-2fa', {}, {
      withCredentials: true,
    });
    console.log('enable2FA response:', response.data);
    return response;
  } catch (error) {
    console.error('enable2FA error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to enable 2FA' };
  }
};

// Create Investment
export const createInvestment = async (data) => {
  console.log('createInvestment request:', data);
  try {
    const response = await api.post('/api/investments/invest', data, {
      // Changed from /dashboard/investments to match backend
      withCredentials: true,
    });
    console.log('createInvestment response:', response.data);
    return response;
  } catch (error) {
    console.error('createInvestment error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create investment' };
  }
};

// Cancel Investment
export const cancelInvestment = async (id) => {
  console.log('cancelInvestment request for ID:', id);
  try {
    const response = await api.delete(`/api/investments/cancel/${id}`, {
      // Changed to match backend route
      withCredentials: true,
    });
    console.log('cancelInvestment response:', response.data);
    return response;
  } catch (error) {
    console.error('cancelInvestment error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to cancel investment' };
  }
};

// Get Investments
export const getInvestments = async (params = {}) => {
  console.log('getInvestments request with params:', params);
  try {
    const response = await api.get('/api/investments', {
      // Changed from /dashboard/investments to match backend
      params,
      withCredentials: true,
    });
    console.log('getInvestments response:', response.data);
    return response;
  } catch (error) {
    console.error('getInvestments error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch investments' };
  }
};

// Get Referrals
export const getReferrals = async () => {
  console.log('getReferrals request');
  try {
    const response = await api.get('/api/users/referrals', {
      // Changed from /referrals to match backend
      withCredentials: true,
    });
    console.log('getReferrals response:', response.data);
    return response;
  } catch (error) {
    console.error('getReferrals error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch referrals' };
  }
};

// Create Comment
export const createComment = async (data) => {
  console.log('createComment request:', data);
  try {
    const response = await api.post('/api/comments', data, {
      withCredentials: true,
    });
    console.log('createComment response:', response.data);
    return response;
  } catch (error) {
    console.error('createComment error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create comment' };
  }
};

// Get Comments
export const getComments = async () => {
  console.log('getComments request');
  try {
    const response = await api.get('/api/comments', {
      withCredentials: true,
    });
    console.log('getComments response:', response.data);
    return response;
  } catch (error) {
    console.error('getComments error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch comments' };
  }
};

// Send Password Reset
export const sendPasswordReset = async (data) => {
  console.log('sendPasswordReset request:', data);
  try {
    const response = await api.post('/api/auth/forgot-password', data, {
      withCredentials: true,
    });
    console.log('sendPasswordReset response:', response.data);
    return response;
  } catch (error) {
    console.error('sendPasswordReset error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to send password reset' };
  }
};

// Get User Stats
export const getUserStats = async () => {
  console.log('getUserStats request');
  try {
    const response = await api.get('/api/users/stats', {
      // Changed from /dashboard/user/stats to match backend
      withCredentials: true,
    });
    console.log('getUserStats response:', response.data);
    return response;
  } catch (error) {
    console.error('getUserStats error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch user stats' };
  }
};

// Get Activity
export const getActivity = async (params = {}) => {
  console.log('getActivity request with params:', params);
  try {
    const response = await api.get('/api/users/activity', {
      // Changed from /dashboard/activity to match backend
      params,
      withCredentials: true,
    });
    console.log('getActivity response:', response.data);
    return response;
  } catch (error) {
    console.error('getActivity error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch activity' };
  }
};

// Get Profile
export const getProfile = async () => {
  const token = localStorage.getItem('token');
  console.log('getProfile request', { token: token ? token.slice(0, 20) + '...' : 'No token' });
  try {
    const response = await api.get('/api/users/profile', {
      // Changed from /dashboard/profile to match backend
      withCredentials: true,
    });
    console.log('getProfile response:', response.data);
    return response;
  } catch (error) {
    console.error('getProfile error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch profile' };
  }
};

// Update Profile
export const updateProfile = async (data) => {
  console.log('updateProfile request:', data);
  try {
    const response = await api.put('/api/users/profile', data, {
      // Changed from /dashboard/profile to match backend
      withCredentials: true,
    });
    console.log('updateProfile response:', response.data);
    return response;
  } catch (error) {
    console.error('updateProfile error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to update profile' };
  }
};

// Request Withdrawal
export const requestWithdrawal = async (data) => {
  console.log('requestWithdrawal request:', data);
  try {
    const response = await api.post('/api/investments/withdraw', data, {
      // Changed from /dashboard/withdraw to match backend
      withCredentials: true,
    });
    console.log('requestWithdrawal response:', response.data);
    return response;
  } catch (error) {
    console.error('requestWithdrawal error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to request withdrawal' };
  }
};

// Verify Withdrawal OTP
export const verifyWithdrawalOTP = async (data) => {
  console.log('verifyWithdrawalOTP request:', data);
  try {
    const response = await api.post('/api/investments/verify-withdrawal-otp', data, {
      // Changed from /dashboard/verify-withdrawal-otp to match backend
      withCredentials: true,
    });
    console.log('verifyWithdrawalOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('verifyWithdrawalOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to verify withdrawal OTP' };
  }
};

// Create Support Ticket
export const createSupportTicket = async (data) => {
  console.log('createSupportTicket request:', data);
  try {
    const response = await api.post('/api/support', data, {
      // Changed to /api/support (assuming backend has a support route)
      withCredentials: true,
    });
    console.log('createSupportTicket response:', response.data);
    return response;
  } catch (error) {
    console.error('createSupportTicket error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create support ticket' };
  }
};

export { api };