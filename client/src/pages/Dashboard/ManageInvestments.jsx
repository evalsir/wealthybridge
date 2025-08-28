// src/pages/Dashboard/ManageInvestments.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvestments, cancelInvestment } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

const ManageInvestments = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const planDisplayNames = {
    basic_1m: 'Basic 1 Month',
    basic_2m: 'Basic 2 Months',
    premium_3m: 'Premium 3 Months',
    premium_6m: 'Premium 6 Months',
    super_9m: 'Super 9 Months',
    super_12m: 'Super 12 Months',
  };

  useEffect(() => {
    if (authLoading) {
      console.log('Auth loading, waiting...');
      return;
    }
    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/signin'); // Changed to /signin for consistency
      return;
    }
    console.log('Fetching investments for user:', user._id);

    const fetchInvestments = async () => {
      setLoading(true);
      try {
        const response = await getInvestments();
        console.log('Investments response:', response);
        setInvestments(response.investments || []);
        setError('');
      } catch (error) {
        console.error('Fetch investments error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        if (error.response?.status === 401) {
          navigate('/signin');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch investments');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [user, authLoading, navigate]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString(); // e.g., "7/26/2025"
    } catch {
      return 'N/A';
    }
  };

  const handleCancel = async (investmentId) => {
    if (!window.confirm('Are you sure you want to cancel this investment?')) return;

    try {
      await cancelInvestment(investmentId);
      setInvestments((prev) =>
        prev.map((inv) =>
          inv._id === investmentId ? { ...inv, status: 'cancelled' } : inv
        )
      );
      setSuccess('Investment cancelled successfully');
      setError('');
    } catch (error) {
      console.error('Cancel investment error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setError(error.response?.data?.message || 'Failed to cancel investment');
      setSuccess('');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Manage Investments</h2>
      <div className="bg-white p-6 rounded-xl shadow-md">
        {success && <p className="text-green-500 mb-4">{success}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {(loading || authLoading) && <p className="text-gray-500 mb-4">Loading...</p>}
        {!loading && !authLoading && investments.length === 0 && (
          <p className="text-gray-500">No investments found.</p>
        )}
        {!loading && !authLoading && investments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">Shares</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Profit</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv._id} className="border-b">
                    <td className="px-4 py-2">{planDisplayNames[inv.plan] || inv.plan}</td>
                    <td className="px-4 py-2">{inv.shares || 1}</td>
                    <td className="px-4 py-2">${inv.amount?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2">
                      ${inv.expectedProfit?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(inv.startDate || inv.createdAt)}
                    </td>
                    <td className="px-4 py-2">{inv.status || 'Unknown'}</td>
                    <td className="px-4 py-2">
                      {inv.status?.toLowerCase() === 'pending' ? (
                        <button
                          onClick={() => handleCancel(inv._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInvestments;