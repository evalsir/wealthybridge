//userDashboard
import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="pt-24 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center text-blue-900">
        {t('dashboard.title', { name: user.name || 'User' })}
      </h1>
      <p className="mt-4 text-lg text-gray-600 text-center">{t('dashboard.description')}</p>
      <div className="mt-6 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800">{t('dashboard.account')}</h2>
        <div className="mt-4 space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role || 'User'}</p>
          <p><strong>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <button
          onClick={() => navigate('/plans')}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
        >
          {t('nav.investments')}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;