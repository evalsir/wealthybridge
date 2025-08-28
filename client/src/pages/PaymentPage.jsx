import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { processVerificationPayment } from "../utils/api";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import logo from "../assets/logo.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const PaymentPage = () => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const userId = query.get("userId");
  const [email, setEmail] = useState(query.get("email") || "");
  const [paymentMethod, setPaymentMethod] = useState("mpesa"); // Default to M-Pesa
  const [verificationAmount, setVerificationAmount] = useState(5);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState("");

  const paymentMethods = [
    { value: "paypal", label: "PayPal", redirect: true },
    { value: "stripe", label: "Stripe", redirect: false },
    { value: "mpesa", label: "M-Pesa", redirect: false }, // M-Pesa uses STK Push, no redirect
    { value: "airtelmoney", label: "Airtel Money", redirect: false },
    { value: "mtn", label: "MTN", redirect: false },
    { value: "tigopesa", label: "Tigo Pesa", redirect: false },
    { value: "skrill", label: "Skrill", redirect: true },
    { value: "flutterwave", label: "Flutterwave", redirect: true },
    { value: "googlepay", label: "Google Pay", redirect: false },
    { value: "mastercard", label: "Mastercard", redirect: false },
  ];

  useEffect(() => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setStripeError(t("signup.stripe_not_initialized"));
      console.error("Stripe publishable key is missing");
    }
    if (!userId) {
      setError(t("signup.user_not_found"));
      console.error("Missing userId");
      navigate("/signin");
    } else if (!email) {
      // Fetch email and phone if missing
      axios
        .get(`https://44f4bb092da7.ngrok-free.app/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          setEmail(res.data.email);
          setPhoneNumber(res.data.phoneNumber || "+254791800900");
        })
        .catch((err) => {
          console.error("Failed to fetch user data:", err.response?.data || err.message);
          setError(t("signup.failed_to_fetch_user_data"));
        });
    }
    console.log("PaymentPage loaded with query params:", { userId, email });
  }, [userId, email, navigate, t]);

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError(t("signup.Select a Payment Option"));
      return;
    }
    if (!userId || !email) {
      setError(t("signup.payment_verification_failed"));
      console.error("Missing userId or email", { userId, email });
      return;
    }
    if (["mpesa", "airtelmoney", "mtn", "tigopesa", "flutterwave"].includes(paymentMethod) &&
        !phoneNumber.match(/^\+\d{10,14}$/)) {
      setError(t("signup.invalid_phone"));
      console.error("Invalid phone number format", { phoneNumber });
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const paymentData = {
      userId,
      amount: Number(verificationAmount),
      email,
      name: "User", // Update if name is available from backend
      phoneNumber: phoneNumber || "",
      isVerificationFee: true,
    };

    if (["stripe", "mastercard", "googlepay"].includes(paymentMethod)) {
      if (!stripe || !elements || stripeError) {
        setError(t("signup.stripe_not_initialized"));
        console.error("Stripe not initialized for payment", { stripe, elements, stripeError });
        setIsSubmitting(false);
        return;
      }
      const cardElement = elements.getElement(CardElement);
      const { token, error } = await stripe.createToken(cardElement);
      if (error) {
        setError(t(error.message));
        console.error("Stripe token creation failed:", error);
        setIsSubmitting(false);
        return;
      }
      paymentData.paymentToken = token.id;
    }

    try {
      console.log("Initiating payment with data:", paymentData);
      const res = await processVerificationPayment(paymentMethod, paymentData);
      console.log("Payment response:", res.data);
      if (res.status === 200 && res.data.redirectUrl) {
        setSuccess(t("signup.payment_initiated"));
        window.location.href = res.data.redirectUrl;
      } else if (res.status === 200) {
        setSuccess(t("verification fee"));
        navigate("/signin");
      }
    } catch (err) {
      console.error("Payment error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(t(err.response?.data?.message || "payment of verification fee failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-20 flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg space-y-4">
        <div className="text-center mb-4">
          <img src={logo} alt="WealthyBridge Logo" className="h-12 mx-auto" />
          <h2 className="text-xl font-semibold mt-2">
            {t("Activation Fee Payment")}
          </h2>
        </div>
        {error && <div className="text-red-500 p-2 bg-red-100 rounded">{error}</div>}
        {success && <div className="text-green-500 p-2 bg-green-100 rounded">{success}</div>}
        {stripeError && (
          <div className="text-red-500 p-2 bg-red-100 rounded">{stripeError}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("Select Payment Method")}
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          >
            <option value="">{t("payment method")}</option>
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("Activation Fee")}
          </label>
          <input
            type="number"
            value={verificationAmount}
            onChange={(e) => setVerificationAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            min={5}
            required
          />
        </div>
        {["mpesa", "airtelmoney", "mtn", "tigopesa", "flutterwave"].includes(paymentMethod) && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("signup.Phone Number")}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +254791800900"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              required
            />
          </div>
        )}
        {["stripe", "mastercard", "googlepay"].includes(paymentMethod) && !stripeError && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("signup.card_details")}
            </label>
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
          onClick={handlePayment}
          disabled={isSubmitting || !paymentMethod || Number(verificationAmount) < 5 || (["stripe", "mastercard", "googlepay"].includes(paymentMethod) && stripeError)}
          className={`w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-300 transition-colors duration-200 ${
            isSubmitting || !paymentMethod || Number(verificationAmount) < 5 || (["stripe", "mastercard", "googlepay"].includes(paymentMethod) && stripeError)
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          {t("Confirm Payment")}
        </button>
      </div>
    </div>
  );
};

export default function WrappedPaymentPage() {
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="pt-20 min-h-screen flex justify-center items-center bg-gray-100">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg space-y-4">
          <div className="text-center mb-4">
            <img src={logo} alt="WealthyBridge Logo" className="h-12 mx-auto" />
            <h2 className="text-xl font-semibold mt-2">
              {t("signup.Activation Fee Payment")}
            </h2>
          </div>
          <div className="text-red-500 p-2 bg-red-100 rounded">
            {t("signup.stripe_not_initialized")}
          </div>
        </div>
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <PaymentPage />
    </Elements>
  );
}