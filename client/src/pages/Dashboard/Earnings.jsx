// src/pages/Dashboard/Earnings.jsx
import React, { useEffect, useState } from "react";
import { getInvestments } from '../../utils/api'; // Updated import name
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const EarningsPage = () => {
  const [earnings, setEarnings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [planTotals, setPlanTotals] = useState({});
  const [lastDate, setLastDate] = useState("");
  const [filters, setFilters] = useState({
    plan: "All",
    start: "",
    end: "",
  });

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await getInvestments({ plan: 'All' });
        const approved = response.filter(inv => inv.status === 'Approved');
        setEarnings(approved);
        setFiltered(approved);
        calculateStats(approved);
      } catch (error) {
        console.error('Error fetching earnings:', error.response || error);
      }
    };
    fetchEarnings();
  }, []);

  const calculateStats = (list) => {
    const total = list.reduce((sum, inv) => sum + inv.profit, 0);
    setTotalProfit(total);

    const grouped = {};
    list.forEach((inv) => {
      grouped[inv.plan] = (grouped[inv.plan] || 0) + inv.profit;
    });
    setPlanTotals(grouped);

    const latest = list
      .map((inv) => new Date(inv.date))
      .sort((a, b) => b - a)[0];
    setLastDate(latest ? latest.toISOString().split("T")[0] : "");
  };

  const handleFilter = async () => {
    try {
      const response = await getInvestments(filters);
      const filteredList = response.filter(inv => {
        const date = new Date(inv.date);
        const start = filters.start ? new Date(filters.start) : null;
        const end = filters.end ? new Date(filters.end) : null;
        const planMatch = filters.plan === "All" || inv.plan.includes(filters.plan);
        const dateMatch = (!start || date >= start) && (!end || date <= end);
        return planMatch && dateMatch;
      });
      setFiltered(filteredList);
      calculateStats(filteredList);
    } catch (error) {
      console.error('Error filtering earnings:', error.response || error);
    }
  };

  const groupByMonth = () => {
    const monthMap = {};
    filtered.forEach((inv) => {
      const [year, month] = inv.date.split("-");
      const key = `${year}-${month}`;
      if (!monthMap[key]) monthMap[key] = 0;
      monthMap[key] += inv.profit;
    });

    return Object.entries(monthMap)
      .map(([month, profit]) => ({ month, profit }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6">Your Earnings</h2>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Profit</h3>
          <p className="text-2xl font-bold">${totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Last Transaction</h3>
          <p className="text-lg font-semibold">{lastDate || "N/A"}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Active Plans</h3>
          <p className="text-lg font-semibold">{Object.keys(planTotals).length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter Earnings</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="All">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
            <option value="Super">Super</option>
          </select>
          <input
            type="date"
            value={filters.start}
            onChange={(e) => setFilters({ ...filters, start: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={filters.end}
            onChange={(e) => setFilters({ ...filters, end: e.target.value })}
            className="border p-2 rounded"
          />
          <button
            onClick={handleFilter}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Profit by Plan</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(planTotals).map(([plan, profit]) => (
            <div key={plan} className="border p-3 rounded">
              <span className="font-medium">{plan}</span>: ${profit.toLocaleString()}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Monthly Profit</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={groupByMonth()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="profit" stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
