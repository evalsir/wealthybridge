import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { processVerificationPayment, initiateRedirectPayment } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";

const PaymentForm = ({ userId, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const stripe = useStripe();
  const elements = useElements();
  const [method, setMethod] = useState("mpesa"); // Default to M-Pesa
  const [amount, setAmount] = useState(5); // Verification fee set to $5
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phone ? `${user.countryCode}${user.phone}` : ""
  );
  const [name, setName] = useState(
    user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : ""
  );
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods = [
    { value: "paypal", label: "PayPal" },
    { value: "stripe", label: "Stripe" },
    { value: "mpesa", label: "M-Pesa" },
    { value: "skrill", label: "Skrill" },
    { value: "mtn", label: "MTN" },
    { value: "mastercard", label: "Mastercard" },
    { value: "flutterwave", label: "Flutterwave" },
    { value: "tigopesa", label: "Tigo Pesa" },
    { value: "airtelmoney", label: "Airtel Money" },
  ];

  useEffect(() => {
    if (!user?.email && userId) {
      axios
        .get(`https://44f4bb092da7.ngrok-free.app/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          setEmail(res.data.email);
          setName(res.data.name || name);
          setPhoneNumber(res.data.phoneNumber || phoneNumber);
        })
        .catch((err) => {
          console.error("Failed to fetch user data:", err.response?.data || err.message);
          setError(t("failed_to_fetch_user_data"));
        });
    }
  }, [userId, user, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !email || !name) {
      setError(t("user_not_found"));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    let paymentData = {
      userId,
      amount: Number(amount),
      email,
      name: name.trim(),
      isVerificationFee: true,
    };

    if (["mpesa", "mtn", "tigopesa", "airtelmoney", "flutterwave"].includes(method)) {
      if (!phoneNumber.match(/^\+\d{10,14}$/)) {
        setError(t("invalid_phone"));
        setIsLoading(false);
        return;
      }
      paymentData.phoneNumber = phoneNumber;
    }

    if (["stripe", "mastercard"].includes(method)) {
      if (!stripe || !elements) {
        setError(t("stripe_not_initialized"));
        setIsLoading(false);
        return;
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError(t("card_input_missing"));
        setIsLoading(false);
        return;
      }
      const { token, error } = await stripe.createToken(cardElement);
      if (error) {
        setError(t(error.message));
        setIsLoading(false);
        return;
      }
      paymentData.paymentToken = token.id;
    }

    try {
      console.log("Submitting payment:", { method, paymentData });
      if (["paypal", "skrill", "flutterwave"].includes(method)) {
        const res = await initiateRedirectPayment(method, paymentData);
        if (res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          setError(t(res.message || "payment_failed"));
        }
      } else {
        const res = await processVerificationPayment(method, paymentData);
        if (res.data.message === "payment_verified") {
          onSuccess();
        } else {
          setError(t(res.data.message || "payment_failed"));
        }
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      setError(t(err.response?.data?.message || "payment_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg space-y-4">
      <h2 className="text-xl font-semibold text-center">{t("verify_payment")}</h2>
      {error && <div className="text-red-500 p-2 bg-red-100 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="method" className="block text-sm font-medium text-gray-700">
            {t("payment_method")}
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          >
            {paymentMethods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t("name")}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("enter_name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            {t("amount")}
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100"
            min="5"
            required
          />
        </div>
        {["mpesa", "mtn", "tigopesa", "airtelmoney", "flutterwave"].includes(method) && (
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              {t("phone")}
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +254791800900"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              required
            />
          </div>
        )}
        {["stripe", "mastercard"].includes(method) && (
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("card_details")}</label>
            <div className="mt-1 block w-full p-2 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: { fontSize: "16px", color: "#32325d", "::placeholder": { color: "#aab7c4" } },
                    invalid: { color: "#fa755a" },
                  },
                }}
              />
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-900 text-white p-2 rounded-md hover:bg-blue-300 ${
            isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {t(["paypal", "skrill", "flutterwave"].includes(method) ? "proceed_to_payment" : "submit_payment")}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;