import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

const Setup2FAPage = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ code: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOTP = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await api.post('/api/auth/resend-2fa-otp', { userId: user.id }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOtpSent(true);
      setSuccess(t('2fa.otp_sent'));
      console.log('2FA OTP request response:', response.data);
      if (response.data.otp) {
        console.log('Development mode OTP:', response.data.otp);
      }
    } catch (err) {
      console.error('2FA OTP request error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(
        err.response?.data?.message === 'user_not_found'
          ? t('2fa.user_not_found')
          : t('2fa.otp_request_error')
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.code.match(/^\d{6}$/)) {
      setError(t('2fa.invalid_otp'));
      return;
    }
    try {
      const response = await api.post('/api/auth/setup-2fa', {
        userId: user.id,
        enable: true,
        code: formData.code,
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess(t('2fa.setup_success'));
      console.log('2FA setup response:', response.data);
      navigate('/dashboard');
    } catch (err) {
      console.error('2FA setup error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(
        err.response?.data?.message === 'invalid_otp'
          ? t('2fa.invalid_otp')
          : err.response?.data?.message === 'otp_expired'
          ? t('2fa.otp_expired')
          : t('2fa.setup_error')
      );
    }
  };

  if (!user) {
    return <div>{t('loading')}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-20 flex justify-center items-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full p-6 bg-white rounded-lg shadow-md space-y-4"
        >
          <h2 className="text-2xl font-semibold text-center text-gray-800">
            {t('2fa.setup_title')}
          </h2>
          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && <p className="text-green-500 text-center">{success}</p>}
          {!otpSent ? (
            <button
              type="button"
              onClick={handleRequestOTP}
              className="w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-300 transition-colors duration-200 cursor-pointer"
            >
              {t('2fa.request_otp')}
            </button>
          ) : (
            <>
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('2fa.enter_otp')}
                </label>
                <input
                  type="text"
                  name="code"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder={t('2fa.enter_otp')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-300 transition-colors duration-200 cursor-pointer"
              >
                {t('2fa.submit')}
              </button>
              <button
                type="button"
                onClick={handleRequestOTP}
                className="w-full bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200 cursor-pointer mt-2"
              >
                {t('2fa.resend_otp')}
              </button>
            </>
          )}
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Setup2FAPage;