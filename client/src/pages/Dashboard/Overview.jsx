// src/pages/Dashboard/Overview.jsx
import React, { useEffect, useState } from "react";
import { FaWallet, FaPiggyBank, FaUserFriends } from "react-icons/fa";
import { getUserStats, getActivity } from '../../utils/api'; // Correct imports

const Overview = () => {
  const [user, setUser] = useState({
    name: "",
    totalInvestment: 0,
    balance: 0,
    referrals: 0,
  });
  const [allActivity, setAllActivity] = useState([]);
  const [filteredActivity, setFilteredActivity] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [error, setError] = useState(""); // Added for error display

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user stats
        const statsResponse = await getUserStats();
        setUser(statsResponse);
        // Fetch activity
        const activityResponse = await getActivity({ type: 'All' });
        setAllActivity(activityResponse);
        setFilteredActivity(activityResponse.slice(0, 8));
      } catch (error) {
        console.error('Error fetching overview data:', error.response || error);
        setError('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 flex items-center gap-4">
      <div className={`p-3 rounded-full text-white ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-sm text-gray-500">{label}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const base = "text-xs font-semibold px-2 py-1 rounded-full";
    switch (status.toLowerCase()) {
      case "approved":
        return `${base} bg-green-100 text-green-700`;
      case "pending":
        return `${base} bg-yellow-100 text-yellow-700`;
      case "declined":
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  const handleFilterChange = async (e) => {
    const type = e.target.value;
    setFilterType(type);
    try {
      const response = await getActivity({ type });
      setFilteredActivity(response.slice(0, 8));
    } catch (error) {
      console.error('Error filtering activity:', error.response || error);
      setError('Failed to filter activity. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome back, <span className="text-blue-600">{user.name || 'guest'}</span> 👋
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        <StatCard
          icon={FaPiggyBank}
          label="Total Investment"
          value={`$${user.totalInvestment.toLocaleString()}`}
          color="bg-blue-600"
        />
        <StatCard
          icon={FaWallet}
          label="Available Balance"
          value={`$${user.balance.toLocaleString()}`}
          color="bg-green-600"
        />
        <StatCard
          icon={FaUserFriends}
          label="Your Referrals"
          value={user.referrals}
          color="bg-purple-600"
        />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <select
            value={filterType}
            onChange={handleFilterChange}
            className="border px-3 py-1 rounded-md text-sm focus:outline-none"
          >
            <option value="All">All</option>
            <option value="Investment">Investments</option>
            <option value="Withdrawal">Withdrawals</option>
          </select>
        </div>

        {filteredActivity.length === 0 ? (
          <p className="text-gray-600">No recent activity found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredActivity.map((item) => (
                <li
                  key={item.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full mr-2 ${
                        item.type === "Investment"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="font-medium">{item.plan}</span>
                    <span className="text-gray-500 ml-2">
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={getStatusBadge(item.status)}>
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {filteredActivity.length === 8 && (
              <div className="text-right p-4 bg-gray-50">
                <a
                  href="/dashboard/activity"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View All Activity →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
