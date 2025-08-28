// src/pages/Dashboard/Withdraw.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserStats, requestWithdrawal, verifyWithdrawalOTP } from '../../utils/api'; // Updated import names

const WithdrawPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Mpesa");
  const [details, setDetails] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await getUserStats();
        setBalance(response.balance);
      } catch (error) {
        console.error('Error fetching balance:', error.response || error);
        setError('Failed to fetch balance');
      }
    };
    fetchBalance();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || !details || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount and payment details.");
      return;
    }

    if (Number(amount) > balance) {
      setError("Insufficient wallet balance for this withdrawal.");
      return;
    }

    try {
      const response = await requestWithdrawal({ amount: Number(amount), method, details });
      setShowOtp(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to request withdrawal');
    }
  };

  const handleOtpSubmit = async () => {
    try {
      const response = await verifyWithdrawalOTP({ amount: Number(amount), method, details, otp });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard/history"), 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Withdraw Funds</h2>

      {success ? (
        <div className="bg-green-100 text-green-700 p-4 rounded">
          Withdrawal request submitted successfully!
        </div>
      ) : showOtp ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4">Verify OTP</h3>
          <p className="text-sm text-gray-600 mb-4">
            An OTP has been sent to your {method === "Mpesa" ? "phone" : "email"}.
          </p>
          <label className="block">
            OTP:
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
            />
          </label>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <button
            onClick={handleOtpSubmit}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Verify OTP
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium">Available Balance</label>
            <p className="text-lg font-bold">${balance.toLocaleString()}</p>
          </div>

          <label className="block">
            Amount:
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
            />
          </label>

          <label className="block">
            Payment Method:
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
            >
              
              <option value="paypal">paypal</option>
              <option value="stripe">stripe</option>
              <option value="Googlepay">Googlepay</option>
              <option value="mastercard">mastercard</option>
              <option value="Mpesa">Mpesa</option>
              <option value="tigopesa">tigopesa</option>
              <option value="flutterwave">flutterwave</option>
              <option value="mtn">mtn</option>
              <option value="airtelmoney">airtelmoney</option>
              <option value="Bank">Bank Transfer</option>

            </select>
          </label>

          <label className="block">
            Payment Details:
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
              placeholder={method === "Mpesa" ? "Phone number" : "Bank account details"}
            />
          </label>

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Request Withdrawal
          </button>
        </form>
      )}
    </div>
  );
};

export default WithdrawPage;
