//src/pages/Dashboard/support.jsx
import React, { useState } from "react";
import { createSupportTicket } from '../../utils/api';

const SupportPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.category || !form.subject || !form.message) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await createSupportTicket(form);
      setSuccess("Support ticket submitted successfully!");
      setForm({ name: "", email: "", category: "", subject: "", message: "" });
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit support ticket");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Support</h2>

      <div className="bg-white p-6 rounded-xl shadow-md">
        {success && <p className="text-green-500 mb-4">{success}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            >
              <option value="">Select a category</option>
              <option value="General">General</option>
              <option value="Account">Account</option>
              <option value="Payments">Payments</option>
              <option value="Technical">Technical</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded h-32"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Ticket
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;
