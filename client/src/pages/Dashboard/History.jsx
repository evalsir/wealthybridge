// src/pages/Dashboard/History.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getInvestments } from '../../utils/api';

const HistoryDashboard = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setError('Please log in to view history');
        setLoading(false);
        return;
      }
      try {
        const response = await getInvestments();
        console.log('Fetched history:', response);
        setHistory(response.investments || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching history:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setError('Failed to load investment history');
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

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

  const getStatusBadge = (status) => {
    const base = 'text-xs font-semibold px-2 py-1 rounded-full';
    switch (status?.toLowerCase()) {
      case 'approved':
        return `${base} bg-green-100 text-green-700`;
      case 'pending':
        return `${base} bg-yellow-100 text-yellow-700`;
      case 'declined':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6">Investment History</h2>
      {history.length === 0 ? (
        <p className="text-gray-600">No investment history found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {history.map((item) => (
              <li
                key={item._id || item.id} // Use _id from MongoDB
                className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div>
                  <span className="font-medium">{item.plan}</span>
                  <span className="text-gray-500 ml-2">
                    ${item.amount?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {formatDate(item.startDate || item.createdAt)}
                  </span>
                  <span className="font-medium">
                    ${item.expectedProfit?.toLocaleString() || 'N/A'}
                  </span>
                  <span className={getStatusBadge(item.status)}>
                    {item.status || 'Unknown'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HistoryDashboard;