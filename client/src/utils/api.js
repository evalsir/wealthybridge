
// client/src/utils/api.js
import axios from 'axios';
import { t } from 'i18next';

// Use environment variable for API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://ea2750dd6ff7.ngrok-free.app';

const api = axios.create({
  baseURL: API_URL, // Fix: Use VITE_API_URL only, remove hard-coded URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Fix: Ensure withCredentials is set globally
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
    const response = await api.post('/api/auth/check-user', data);
    console.log('checkUserStatus response:', response.data);
    return response;
  } catch (error) {
    // Fix: Handle 404 explicitly to allow signup flow
    if (error.response?.status === 404) {
      return { status: 404, data: { exists: false, message: 'User not found' } };
    }
    console.error('checkUserStatus error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to check user status', status: error.response?.status || 500 };
  }
};

// Signup
export const SignupPage = async (data) => {
  console.log('SignupPage request:', data);
  try {
    const response = await api.post('/api/auth/signup', data); // Fix: Changed to /register to match backend
    console.log('SignupPage response:', response.data);
    return response;
  } catch (error) {
    console.error('SignupPage error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Signup failed', status: error.response?.status || 500 };
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
    const response = await api.post('/api/auth/verify-otps', payload);
    console.log('VerifyEmailOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('VerifyEmailOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Email OTP verification failed', status: error.response?.status || 500 };
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
    const response = await api.post('/api/auth/verify-otps', payload);
    console.log('VerifyPhoneOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('VerifyPhoneOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Phone OTP verification failed', status: error.response?.status || 500 };
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
    const response = await api.post('/api/auth/resend-email-otp', payload);
    console.log('ResendEmailOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('ResendEmailOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to resend email OTP', status: error.response?.status || 500 };
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
    const response = await api.post('/api/auth/resend-phone-otp', payload);
    console.log('ResendPhoneOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('ResendPhoneOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to resend phone OTP', status: error.response?.status || 500 };
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
    const response = await api.post('/api/auth/setup-2fa', payload);
    console.log('setup2FA response:', response.data);
    return response;
  } catch (error) {
    console.error('setup2FA error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to setup 2FA', status: error.response?.status || 500 };
  }
};

// Resend 2FA OTP
export const resend2FAOTP = async (data) => {
  const payload = {
    userId: data.userId,
  };
  console.log('resend2FAOTP request:', payload);
  try {
    const response = await api.post('/api/auth/resend-2fa-otp', payload);
    console.log('resend2FAOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('resend2FAOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to resend 2FA OTP', status: error.response?.status || 500 };
  }
};

// Process Verification Payment
export const processVerificationPayment = async (method, data) => {
  console.log(`processVerificationPayment request for ${method}:`, data);
  try {
    const endpoint = method.startsWith('callback/') ? `/api/payments/${method}` : `/api/payments/process`;
    const response = await api.post(endpoint, data, {
      timeout: 60000,
    });
    console.log(`processVerificationPayment response for ${method}:`, response.data);
    return response;
  } catch (error) {
    console.error(`processVerificationPayment error for ${method}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Payment processing failed for ${method}`, status: error.response?.status || 500 };
  }
};

// Login
export const loginUser = async (data) => {
  console.log('loginUser request:', data);
  try {
    const response = await api.post('/api/auth/login', data);
    console.log('loginUser response:', response.data);
    localStorage.setItem('token', response.data.token);
    return response;
  } catch (error) {
    console.error('loginUser error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Login failed', status: error.response?.status || 500 };
  }
};

// Verify 2FA
export const verify2FA = async (data) => {
  console.log('verify2FA request:', data);
  try {
    const response = await api.post('/api/auth/verify-2fa', data);
    console.log('verify2FA response:', response.data);
    return response;
  } catch (error) {
    console.error('verify2FA error:', error.response?.data || error.message);
    throw error.response?.data || { error: '2FA verification failed', status: error.response?.status || 500 };
  }
};

// Enable 2FA
export const enable2FA = async () => {
  console.log('enable2FA request');
  try {
    const response = await api.post('/api/auth/enable-2fa', {});
    console.log('enable2FA response:', response.data);
    return response;
  } catch (error) {
    console.error('enable2FA error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to enable 2FA', status: error.response?.status || 500 };
  }
};

// Create Investment
export const createInvestment = async (data) => {
  console.log('createInvestment request:', data);
  try {
    const response = await api.post('/api/investments/invest', data);
    console.log('createInvestment response:', response.data);
    return response;
  } catch (error) {
    console.error('createInvestment error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create investment', status: error.response?.status || 500 };
  }
};

// Cancel Investment
export const cancelInvestment = async (id) => {
  console.log('cancelInvestment request for ID:', id);
  try {
    const response = await api.delete(`/api/investments/cancel/${id}`);
    console.log('cancelInvestment response:', response.data);
    return response;
  } catch (error) {
    console.error('cancelInvestment error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to cancel investment', status: error.response?.status || 500 };
  }
};

// Get Investments
export const getInvestments = async (params = {}) => {
  console.log('getInvestments request with params:', params);
  try {
    const response = await api.get('/api/investments', { params });
    console.log('getInvestments response:', response.data);
    return response;
  } catch (error) {
    console.error('getInvestments error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch investments', status: error.response?.status || 500 };
  }
};

// Get Referrals
export const getReferrals = async () => {
  console.log('getReferrals request');
  try {
    const response = await api.get('/api/users/referrals');
    console.log('getReferrals response:', response.data);
    return response;
  } catch (error) {
    console.error('getReferrals error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch referrals', status: error.response?.status || 500 };
  }
};

// Create Comment
export const createComment = async (data) => {
  console.log('createComment request:', data);
  try {
    const response = await api.post('/api/comments', data);
    console.log('createComment response:', response.data);
    return response;
  } catch (error) {
    console.error('createComment error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create comment', status: error.response?.status || 500 };
  }
};

// Get Comments
export const getComments = async () => {
  console.log('getComments request');
  try {
    const response = await api.get('/api/comments');
    console.log('getComments response:', response.data);
    return response;
  } catch (error) {
    console.error('getComments error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch comments', status: error.response?.status || 500 };
  }
};

// Send Password Reset
export const sendPasswordReset = async (data) => {
  console.log('sendPasswordReset request:', data);
  try {
    const response = await api.post('/api/auth/forgot-password', data);
    console.log('sendPasswordReset response:', response.data);
    return response;
  } catch (error) {
    console.error('sendPasswordReset error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to send password reset', status: error.response?.status || 500 };
  }
};

// Get User Stats
export const getUserStats = async () => {
  console.log('getUserStats request');
  try {
    const response = await api.get('/api/users/stats');
    console.log('getUserStats response:', response.data);
    return response;
  } catch (error) {
    console.error('getUserStats error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch user stats', status: error.response?.status || 500 };
  }
};

// Get Activity
export const getActivity = async (params = {}) => {
  console.log('getActivity request with params:', params);
  try {
    const response = await api.get('/api/users/activity', { params });
    console.log('getActivity response:', response.data);
    return response;
  } catch (error) {
    console.error('getActivity error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch activity', status: error.response?.status || 500 };
  }
};

// Get Profile
export const getProfile = async () => {
  const token = localStorage.getItem('token');
  // Fix: Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('getProfile request', { token: token ? token.slice(0, 20) + '...' : 'No token' });
  }
  try {
    const response = await api.get('/api/users/profile');
    console.log('getProfile response:', response.data);
    return response; // Fix: Return full response to allow data extraction
  } catch (error) {
    console.error('getProfile error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch profile', status: error.response?.status || 500 };
  }
};

// Update Profile
export const updateProfile = async (data) => {
  console.log('updateProfile request:', data);
  try {
    const response = await api.put('/api/users/profile', data);
    console.log('updateProfile response:', response.data);
    return response;
  } catch (error) {
    console.error('updateProfile error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to update profile', status: error.response?.status || 500 };
  }
};

// Request Withdrawal
export const requestWithdrawal = async (data) => {
  console.log('requestWithdrawal request:', data);
  try {
    const response = await api.post('/api/investments/withdraw', data);
    console.log('requestWithdrawal response:', response.data);
    return response;
  } catch (error) {
    console.error('requestWithdrawal error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to request withdrawal', status: error.response?.status || 500 };
  }
};

// Verify Withdrawal OTP
export const verifyWithdrawalOTP = async (data) => {
  console.log('verifyWithdrawalOTP request:', data);
  try {
    const response = await api.post('/api/investments/verify-withdrawal-otp', data);
    console.log('verifyWithdrawalOTP response:', response.data);
    return response;
  } catch (error) {
    console.error('verifyWithdrawalOTP error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to verify withdrawal OTP', status: error.response?.status || 500 };
  }
};

// Create Support Ticket
export const createSupportTicket = async (data) => {
  console.log('createSupportTicket request:', data);
  try {
    const response = await api.post('/api/support', data);
    console.log('createSupportTicket response:', response.data);
    return response;
  } catch (error) {
    console.error('createSupportTicket error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create support ticket', status: error.response?.status || 500 };
  }
};

export { api };