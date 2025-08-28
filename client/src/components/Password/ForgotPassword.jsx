import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await api.post("/api/auth/forgot-password", { email });
      setMessage(response.message || "Password reset instructions sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your registered email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Send Reset Link
          </button>
        </form>

        {message && <p className="mt-4 text-green-600 text-sm text-center">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}

        <div className="mt-6 text-center">
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => navigate("/signin")}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
