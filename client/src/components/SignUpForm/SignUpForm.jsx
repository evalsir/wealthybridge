
// src/components/SignUpForm/SignUpForm.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SignupPage,
  VerifyEmailOTP,
  VerifyPhoneOTP,
  processVerificationPayment,
  setup2FA,
  checkUserStatus,
} from "../../utils/api";
import OTPVerification from "../Auth/OTPVerification";
import logo from "../../assets/logo.png";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

const SignUpForm = () => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    username: "",
    email: "",
    phone: "",
    countryCode: "+254",
    password: "",
    referral: "",
    termsAccepted: false,
    enable2FA: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState(null);
  const [verificationAmount, setVerificationAmount] = useState(5);

  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  const phoneRegex = /^\d{9,16}$/;
  const countryCodeRegex = /^\+\d{1,4}$/;
  const paymentMethods = [
    { value: "paypal", label: "PayPal", redirect: true },
    { value: "stripe", label: "Stripe", redirect: false },
    { value: "mpesa", label: "M-Pesa", redirect: false },
    { value: "airtelmoney", label: "Airtel Money", redirect: false },
    { value: "mtn", label: "MTN", redirect: false },
    { value: "tigopesa", label: "Tigo Pesa", redirect: false },
    { value: "skrill", label: "Skrill", redirect: true },
    { value: "flutterwave", label: "Flutterwave", redirect: true },
    { value: "googlepay", label: "Google Pay", redirect: false },
    { value: "mastercard", label: "Mastercard", redirect: false },
  ];

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const userId = query.get("userId");
    const paymentMethod = query.get("method");
    const transactionId = query.get("transactionId");
    const status = query.get("status");

    if (userId && paymentMethod && status === "success") {
      handlePaymentCallback({ userId, paymentMethod, transactionId });
    } else if (status === "cancel") {
      setError(t("payment cancelled"));
      setStep("payment");
    }
  }, [location, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value.trim(),
    }));
  };

  const handleCheckUserStatus = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (!formData.firstName) {
      setError(t("first name required"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.secondName) {
      setError(t("last name required"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.username) {
      setError(t("username required"));
      setIsSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t("invalid email"));
      setIsSubmitting(false);
      return;
    }
    if (!countryCodeRegex.test(formData.countryCode)) {
      setError(t("invalid_country_code"));
      setIsSubmitting(false);
      return;
    }
    if (!phoneRegex.test(formData.phone)) {
      setError(t("invalid phone"));
      setIsSubmitting(false);
      return;
    }
    if (!strongPassword.test(formData.password)) {
      setError(t("strong password required"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.termsAccepted) {
      setError(t("terms required"));
      setIsSubmitting(false);
      return;
    }

    console.log("Checking user status:", {
      email: formData.email,
      phone: formData.phone,
      countryCode: formData.countryCode,
    });
    try {
      const res = await checkUserStatus({
        email: formData.email,
        phone: formData.phone,
        countryCode: formData.countryCode,
      });
      console.log("Check user response:", res.data);
      // Fix: Handle specific response messages and status codes
      if (res.status === 200) {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token); // Store token
        }
        setUserId(res.data.userId);
        if (res.data.message === "email_otp_resent") {
          setSuccess(t("otp.email_otp_resent"));
          setStep("emailOTP");
        } else if (res.data.message === "phone_otp_resent") {
          setSuccess(t("otp.phone_otp_resent"));
          setStep("phoneOTP");
        } else if (res.data.message === "payment_required") {
          setSuccess(t("You are already registered and your account is active. Please proceed to pay the activation fee to complete registration."));
          setStep("payment");
        } else if (res.data.message === "user_verified") {
          setSuccess(t("user_already_verified"));
          navigate("/signin");
        } else {
          setError(t("unexpected_response"));
        }
      } else if (res.status === 404) {
        console.log("User not found, proceeding to signup");
        await handleSubmit(e);
      } else {
        setError(t(res.data.message || "unexpected_response"));
      }
    } catch (error) {
      console.error("Check user error:", error);
      // Fix: Handle error.status explicitly
      if (error.status === 404) {
        console.log("User not found, proceeding to signup");
        await handleSubmit(e);
      } else {
        setError(t(error.message || "check_user_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    console.log("Submitting signup form:", { ...formData });
    try {
      const res = await SignupPage({ ...formData });
      console.log("Signup response:", res.data);
      if (res.status === 201 || res.status === 200) {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token); // Store token
        }
        setSuccess(t("user_registered"));
        setUserId(res.data.userId);
        if (res.data.message === "email_otp_resent") {
          setStep("emailOTP");
        } else if (res.data.message === "phone_otp_resent") {
          setStep("phoneOTP");
        } else if (res.data.message === "payment_required") {
          setStep("payment");
        } else if (res.data.message === "user_verified") {
          setSuccess(t("user_already_verified"));
          navigate("/signin");
        } else {
          setError(t("unexpected_response"));
        }
      } else {
        setError(t(res.data.message || "unexpected_response"));
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error.message || error.error || "signup_failed";
      if (errorMessage === "user_exists") {
        setSuccess(t("user_registered"));
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
          });
          console.log("Check user status after user_exists:", statusRes.data);
          if (statusRes.data.token) {
            localStorage.setItem("token", statusRes.data.token); // Store token
          }
          setUserId(statusRes.data.userId);
          if (statusRes.status === 200) {
            if (statusRes.data.message === "email_otp_resent") {
              setStep("emailOTP");
            } else if (statusRes.data.message === "phone_otp_resent") {
              setStep("phoneOTP");
            } else if (statusRes.data.message === "payment_required") {
              setStep("payment");
            } else if (statusRes.data.message === "user_verified") {
              setSuccess(t("user_already_verified"));
              navigate("/signin");
            } else {
              setError(t("unexpected_response"));
            }
          } else {
            setError(t("check_user_failed"));
          }
        } catch (statusError) {
          console.error(
            "Check user status error after user_exists:",
            statusError
          );
          setError(t("check_user_failed"));
        }
      } else {
        setError(t(errorMessage));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailOTP = async (otp, message) => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError(t("invalid otp"));
      return;
    }
    if (isSubmitting) {
      console.log(
        "Ignoring duplicate OTP submission for email:",
        formData.email
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    console.log("Submitting email OTP:", { email: formData.email, code: otp });
    try {
      const res = await VerifyEmailOTP({ email: formData.email, code: otp });
      console.log("Email OTP response:", res.data);
      if (res.status === 200) {
        setSuccess(t(res.data.message || "otp.email_verified"));
        setStep("phoneOTP");
      }
    } catch (error) {
      console.error(
        "Email OTP verification error:",
        error
      );
      if (error.details === "no_otp_record") {
        console.log(
          "No OTP record found, checking user status to confirm verification"
        );
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
          });
          console.log("Post-OTP user status:", statusRes.data);
          if (
            statusRes.status === 200 &&
            statusRes.data.message === "phone_otp_resent"
          ) {
            setSuccess(t("otp.email_verified"));
            setStep("phoneOTP");
          } else if (statusRes.data.message === "payment_required") {
            setSuccess(t("otp.email_verified"));
            setStep("payment");
          } else if (statusRes.data.message === "user_verified") {
            setSuccess(t("user_already_verified"));
            navigate("/signin");
          } else {
            setError(t("email otp failed") + " " + t("no_otp_record"));
          }
        } catch (statusError) {
          console.error(
            "Post-OTP user status check error:",
            statusError
          );
          setError(t("otp.email_otp_failed") + " " + t("no_otp_record"));
        }
      } else {
        setError(t(error.message || "otp.email_otp_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneOTP = async (otp, message) => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError(t("Invalid OTP"));
      return;
    }
    if (isSubmitting) {
      console.log(
        "Ignoring duplicate OTP submission for phone:",
        formData.phone
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    console.log("Submitting phone OTP:", {
      phone: formData.phone,
      countryCode: formData.countryCode,
      code: otp,
    });
    try {
      const res = await VerifyPhoneOTP({
        phone: formData.phone,
        countryCode: formData.countryCode,
        code: otp,
      });
      console.log("Phone OTP response:", res.data);
      if (res.status === 200) {
        setSuccess(
          t(
            res.data.message ||
              "Your phone number has been successfully verified. Please proceed with the activation fee payment below."
          )
        );
        setStep(formData.enable2FA ? "twoFactorOTP" : "payment");
      }
    } catch (error) {
      console.error(
        "Phone OTP verification error:",
        error
      );
      if (error.details === "no_otp_record") {
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
          });
          console.log("Post-OTP user status:", statusRes.data);
          if (
            statusRes.status === 200 &&
            statusRes.data.message === "payment_required"
          ) {
            setSuccess(
              t(
                "Your phone number has been successfully verified. Please proceed with the activation fee payment below."
              )
            );
            setStep("payment");
          } else if (statusRes.data.message === "user_verified") {
            setSuccess(t("user_already_verified"));
            navigate("/signin");
          } else {
            setError(t("otp.phone_otp_failed") + " " + t("no_otp_record"));
          }
        } catch (statusError) {
          console.error(
            "Post-OTP user status check error:",
            statusError
          );
          setError(t("otp.phone_otp_failed") + " " + t("no_otp_record"));
        }
      } else {
        setError(t(error.message || "otp.phone_otp_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FAOTP = async (otp, message) => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError(t("Invalid OTP"));
      return;
    }
    if (isSubmitting) {
      console.log("Ignoring duplicate OTP submission for 2FA:", userId);
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    console.log("Submitting 2FA OTP:", { userId, code: otp });
    try {
      const res = await setup2FA({ userId, enable: true, code: otp });
      console.log("2FA setup response:", res.data);
      if (res.status === 200) {
        setSuccess(t(res.data.message || "otp.2fa_setup_complete"));
        setStep("payment");
      }
    } catch (error) {
      console.error(
        "2FA OTP verification error:",
        error
      );
      if (error.details === "no_otp_record") {
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
          });
          console.log("Post-OTP user status:", statusRes.data);
          if (
            statusRes.status === 200 &&
            statusRes.data.message === "payment_required"
          ) {
            setSuccess(t("otp.2fa_setup_complete"));
            setStep("payment");
          } else if (statusRes.data.message === "user_verified") {
            setSuccess(t("user_already_verified"));
            navigate("/signin");
          } else {
            setError(t("otp.2fa_otp_failed") + " " + t("no_otp_record"));
          }
        } catch (statusError) {
          console.error(
            "Post-OTP user status check error:",
            statusError
          );
          setError(t("otp.2fa_otp_failed") + " " + t("no_otp_record"));
        }
      } else {
        setError(t(error.message || "otp.2fa_otp_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError(t("Select a Payment Option"));
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const selectedMethod = paymentMethods.find(
      (m) => m.value === paymentMethod
    );

    const amountValue = Number(verificationAmount);
    if (amountValue < 5) {
      setError(t("minimum_verification_amount_error"));
      setIsSubmitting(false);
      return;
    }

    const paymentData = {
      userId,
      amount: amountValue,
      email: formData.email,
      name: `${formData.firstName} ${formData.secondName}`,
      phoneNumber: phoneNumber || `${formData.countryCode}${formData.phone}`,
      isVerificationFee: true,
    };

    if (["mpesa", "airtelmoney", "mtn", "tigopesa", "flutterwave"].includes(paymentMethod)) {
      if (!paymentData.phoneNumber.match(/^\+\d{10,14}$/)) {
        setError(t("invalid_phone"));
        setIsSubmitting(false);
        return;
      }
    }

    // Fix: Add Stripe-specific handling for CardElement
    if (["stripe", "mastercard", "googlepay"].includes(paymentMethod)) {
      if (!stripe || !elements) {
        setError(t("stripe_not_loaded"));
        setIsSubmitting(false);
        return;
      }
      try {
        const cardElement = elements.getElement(CardElement);
        const { error: stripeError, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            email: formData.email,
            name: `${formData.firstName} ${formData.secondName}`,
            phone: paymentData.phoneNumber,
          },
        });

        if (stripeError) {
          setError(t(stripeError.message || "payment_verification_failed"));
          setIsSubmitting(false);
          return;
        }

        paymentData.stripePaymentMethodId = stripePaymentMethod.id;
      } catch (error) {
        console.error("Stripe payment method creation error:", error);
        setError(t("payment_verification_failed"));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      console.log(`Initiating payment for ${paymentMethod}:`, paymentData);
      const res = await processVerificationPayment(paymentMethod, paymentData);
      console.log("Payment initiation response:", res.data);
      if (res.status === 200) {
        if (selectedMethod.redirect && res.data.redirectUrl) {
          setSuccess(t("payment_initiated"));
          setPaymentRedirectUrl(res.data.redirectUrl);
          window.location.href = res.data.redirectUrl;
        } else {
          setSuccess(t(res.data.message || "payment_verified"));
          setFormData({
            firstName: "",
            secondName: "",
            username: "",
            email: "",
            phone: "",
            countryCode: "+254",
            password: "",
            referral: "",
            termsAccepted: false,
            enable2FA: false,
          });
          navigate("/signin");
        }
      } else {
        setError(t(res.data.message || "payment initiation failed"));
      }
    } catch (error) {
      console.error(
        `Payment error for ${paymentMethod}:`,
        error
      );
      if (error.message === "route_not_found") {
        setError(t("payment_method_unavailable", { method: paymentMethod }));
      } else {
        setError(t(error.message || "payment_verification_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentCallback = async ({
    userId,
    paymentMethod,
    transactionId,
  }) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await processVerificationPayment(
        `callback/${paymentMethod}`,
        {
          userId,
          transactionId,
          email: formData.email,
          name: `${formData.firstName} ${formData.secondName}`,
          phoneNumber: `${formData.countryCode}${formData.phone}`,
        }
      );
      console.log("Payment callback response:", res.data);
      if (res.status === 200) {
        setSuccess(t(res.data.message || "payment_verified"));
        setFormData({
          firstName: "",
          secondName: "",
          username: "",
          email: "",
          phone: "",
          countryCode: "+254",
          password: "",
          referral: "",
          termsAccepted: false,
          enable2FA: false,
        });
        navigate("/signin");
      }
    } catch (error) {
      console.error(
        "Payment callback error:",
        error
      );
      setError(t(error.message || "payment_verification_failed"));
      setStep("payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setError("");
    setSuccess("");
    if (step === "emailOTP") {
      setStep("form");
    } else if (step === "phoneOTP") {
      setStep("emailOTP");
    } else if (step === "twoFactorOTP") {
      setStep("phoneOTP");
    } else if (step === "payment") {
      setStep(formData.enable2FA ? "twoFactorOTP" : "phoneOTP");
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-34 min-h-screen flex justify-center items-center bg-gray-100">
        {step === "form" && (
          <form
            onSubmit={handleCheckUserStatus}
            className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg space-y-4"
          >
            <div className="text-center mb-4">
              <img
                src={logo}
                alt="WealthyBridge Logo"
                className="h-12 mx-auto"
              />
              <h2 className="text-xl font-semibold mt-2 items-center">
                {t("Welcome to Wealthy Bridge")}
              </h2>
            </div>
            {error && (
              <div className="text-red-500 p-2 bg-red-100 rounded">{error}</div>
            )}
            {success && (
              <div className="text-green-500 p-2 bg-green-100 rounded">
                {success}
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("First Name")}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={t("e.g John")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
              <div className="w-full md:w-1/2">
                <label
                  htmlFor="secondName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("Last Name")}
                </label>
                <input
                  type="text"
                  id="secondName"
                  name="secondName"
                  required
                  value={formData.secondName}
                  onChange={handleChange}
                  placeholder={t("e.g Doe")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Username")}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder={t("e.g johndoe1")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Email Address")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={t("e.g johndoe@gmail.com")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div>
              <label
                htmlFor="countryCode"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Country")}
              </label>
              <select
                id="countryCode"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              >
                <option value="+355">+355 (Albania)</option>
                <option value="+213">+213 (Algeria)</option>
                <option value="+376">+376 (Andorra)</option>
                <option value="+244">+244 (Angola)</option>
                <option value="+1-268">+1-268 (Antigua and Barbuda)</option>
                <option value="+54">+54 (Argentina)</option>
                <option value="+374">+374 (Armenia)</option>
                <option value="+61">+61 (Australia)</option>
                <option value="+43">+43 (Austria)</option>
                <option value="+994">+994 (Azerbaijan)</option>
                <option value="+1-242">+1-242 (Bahamas)</option>
                <option value="+973">+973 (Bahrain)</option>
                <option value="+880">+880 (Bangladesh)</option>
                <option value="+1-246">+1-246 (Barbados)</option>
                <option value="+375">+375 (Belarus)</option>
                <option value="+32">+32 (Belgium)</option>
                <option value="+501">+501 (Belize)</option>
                <option value="+229">+229 (Benin)</option>
                <option value="+975">+975 (Bhutan)</option>
                <option value="+591">+591 (Bolivia)</option>
                <option value="+387">+387 (Bosnia and Herzegovina)</option>
                <option value="+267">+267 (Botswana)</option>
                <option value="+55">+55 (Brazil)</option>
                <option value="+673">+673 (Brunei)</option>
                <option value="+359">+359 (Bulgaria)</option>
                <option value="+226">+226 (Burkina Faso)</option>
                <option value="+257">+257 (Burundi)</option>
                <option value="+855">+855 (Cambodia)</option>
                <option value="+237">+237 (Cameroon)</option>
                <option value="+1">+1 (Canada)</option>
                <option value="+238">+238 (Cape Verde)</option>
                <option value="+56">+56 (Chile)</option>
                <option value="+57">+57 (Colombia)</option>
                <option value="+269">+269 (Comoros)</option>
                <option value="+506">+506 (Costa Rica)</option>
                <option value="+385">+385 (Croatia)</option>
                <option value="+357">+357 (Cyprus)</option>
                <option value="+420">+420 (Czech Republic)</option>
                <option value="+243">
                  +243 (Democratic Republic of the Congo)
                </option>
                <option value="+45">+45 (Denmark)</option>
                <option value="+253">+253 (Djibouti)</option>
                <option value="+1-767">+1-767 (Dominica)</option>
                <option value="+1-809">+1-809 (Dominican Republic)</option>
                <option value="+593">+593 (Ecuador)</option>
                <option value="+20">+20 (Egypt)</option>
                <option value="+503">+503 (El Salvador)</option>
                <option value="+372">+372 (Estonia)</option>
                <option value="+268">+268 (Eswatini)</option>
                <option value="+251">+251 (Ethiopia)</option>
                <option value="+679">+679 (Fiji)</option>
                <option value="+358">+358 (Finland)</option>
                <option value="+33">+33 (France)</option>
                <option value="+241">+241 (Gabon)</option>
                <option value="+220">+220 (Gambia)</option>
                <option value="+995">+995 (Georgia)</option>
                <option value="+49">+49 (Germany)</option>
                <option value="+233">+233 (Ghana)</option>
                <option value="+30">+30 (Greece)</option>
                <option value="+1-473">+1-473 (Grenada)</option>
                <option value="+502">+502 (Guatemala)</option>
                <option value="+224">+224 (Guinea)</option>
                <option value="+245">+245 (Guinea-Bissau)</option>
                <option value="+592">+592 (Guyana)</option>
                <option value="+504">+504 (Honduras)</option>
                <option value="+852">+852 (Hong Kong)</option>
                <option value="+36">+36 (Hungary)</option>
                <option value="+354">+354 (Iceland)</option>
                <option value="+91">+91 (India)</option>
                <option value="+62">+62 (Indonesia)</option>
                <option value="+353">+353 (Ireland)</option>
                <option value="+972">+972 (Israel)</option>
                <option value="+39">+39 (Italy)</option>
                <option value="+1-876">+1-876 (Jamaica)</option>
                <option value="+81">+81 (Japan)</option>
                <option value="+962">+962 (Jordan)</option>
                <option value="+7">+7 (Kazakhstan)</option>
                <option value="+254">+254 (Kenya)</option>
                <option value="+965">+965 (Kuwait)</option>
                <option value="+996">+996 (Kyrgyzstan)</option>
                <option value="+856">+856 (Laos)</option>
                <option value="+371">+371 (Latvia)</option>
                <option value="+961">+961 (Lebanon)</option>
                <option value="+266">+266 (Lesotho)</option>
                <option value="+231">+231 (Liberia)</option>
                <option value="+423">+423 (Liechtenstein)</option>
                <option value="+370">+370 (Lithuania)</option>
                <option value="+352">+352 (Luxembourg)</option>
                <option value="+261">+261 (Madagascar)</option>
                <option value="+265">+265 (Malawi)</option>
                <option value="+60">+60 (Malaysia)</option>
                <option value="+960">+960 (Maldives)</option>
                <option value="+223">+223 (Mali)</option>
                <option value="+356">+356 (Malta)</option>
                <option value="+222">+222 (Mauritania)</option>
                <option value="+230">+230 (Mauritius)</option>
                <option value="+52">+52 (Mexico)</option>
                <option value="+373">+373 (Moldova)</option>
                <option value="+377">+377 (Monaco)</option>
                <option value="+976">+976 (Mongolia)</option>
                <option value="+382">+382 (Montenegro)</option>
                <option value="+212">+212 (Morocco)</option>
                <option value="+258">+258 (Mozambique)</option>
                <option value="+264">+264 (Namibia)</option>
                <option value="+977">+977 (Nepal)</option>
                <option value="+31">+31 (Netherlands)</option>
                <option value="+64">+64 (New Zealand)</option>
                <option value="+505">+505 (Nicaragua)</option>
                <option value="+227">+227 (Niger)</option>
                <option value="+234">+234 (Nigeria)</option>
                <option value="+389">+389 (North Macedonia)</option>
                <option value="+47">+47 (Norway)</option>
                <option value="+968">+968 (Oman)</option>
                <option value="+92">+92 (Pakistan)</option>
                <option value="+507">+507 (Panama)</option>
                <option value="+675">+675 (Papua New Guinea)</option>
                <option value="+595">+595 (Paraguay)</option>
                <option value="+51">+51 (Peru)</option>
                <option value="+63">+63 (Philippines)</option>
                <option value="+48">+48 (Poland)</option>
                <option value="+351">+351 (Portugal)</option>
                <option value="+974">+974 (Qatar)</option>
                <option value="+40">+40 (Romania)</option>
                <option value="+7">+7 (Russia)</option>
                <option value="+250">+250 (Rwanda)</option>
                <option value="+1-869">+1-869 (Saint Kitts and Nevis)</option>
                <option value="+1-758">+1-758 (Saint Lucia)</option>
                <option value="+1-784">
                  +1-784 (Saint Vincent and the Grenadines)
                </option>
                <option value="+685">+685 (Samoa)</option>
                <option value="+378">+378 (San Marino)</option>
                <option value="+239">+239 (Sao Tome and Principe)</option>
                <option value="+966">+966 (Saudi Arabia)</option>
                <option value="+221">+221 (Senegal)</option>
                <option value="+381">+381 (Serbia)</option>
                <option value="+248">+248 (Seychelles)</option>
                <option value="+232">+232 (Sierra Leone)</option>
                <option value="+65">+65 (Singapore)</option>
                <option value="+421">+421 (Slovakia)</option>
                <option value="+386">+386 (Slovenia)</option>
                <option value="+27">+27 (South Africa)</option>
                <option value="+82">+82 (South Korea)</option>
                <option value="+34">+34 (Spain)</option>
                <option value="+94">+94 (Sri Lanka)</option>
                <option value="+597">+597 (Suriname)</option>
                <option value="+46">+46 (Sweden)</option>
                <option value="+41">+41 (Switzerland)</option>
                <option value="+886">+886 (Taiwan)</option>
                <option value="+992">+992 (Tajikistan)</option>
                <option value="+255">+255 (Tanzania)</option>
                <option value="+66">+66 (Thailand)</option>
                <option value="+228">+228 (Togo)</option>
                <option value="+1-868">+1-868 (Trinidad and Tobago)</option>
                <option value="+216">+216 (Tunisia)</option>
                <option value="+90">+90 (Turkey)</option>
                <option value="+256">+256 (Uganda)</option>
                <option value="+380">+380 (Ukraine)</option>
                <option value="+971">+971 (United Arab Emirates)</option>
                <option value="+44">+44 (United Kingdom)</option>
                <option value="+1">+1 (United States)</option>
                <option value="+598">+598 (Uruguay)</option>
                <option value="+998">+998 (Uzbekistan)</option>
                <option value="+678">+678 (Vanuatu)</option>
                <option value="+84">+84 (Vietnam)</option>
                <option value="+260">+260 (Zambia)</option>
                <option value="+263">+263 (Zimbabwe)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Phone Number")}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g +44 792-345-8678"
                pattern="[0-9]{9,15}"
                minLength={9}
                maxLength={15}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Create Your Password")}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={t(" ")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div>
              <label
                htmlFor="referral"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Referral Code")} ({t("Optional")})
              </label>
              <input
                type="text"
                id="referral"
                name="referral"
                value={formData.referral}
                onChange={handleChange}
                placeholder={t("")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mr-2 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                />
                {t("By creating an account, you agree to our")}{" "}
                <NavLink to="/legal" className="text-blue-600 underline">
                  {t("Terms & Conditions")}
                </NavLink>{" "}
                {"and have acknowledged the"}{" "}
                <NavLink to="/privacy" className="text-blue-600 underline">
                  {t("Global Privacy Statement")}
                </NavLink>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="enable2FA"
                  checked={formData.enable2FA}
                  onChange={handleChange}
                  className="mr-2 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                />
                {t("Enable 2FA")}
              </label>
            </div>
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors duration-200 ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {isSubmitting ? t("submitting") : t("Sign Up")}
              </button>
            </div>
            <p className="text-sm text-center text-gray-600 mt-4">
              {t("Already have an account?")}{" "}
              <NavLink to="/signin" className="text-blue-600 underline">
                {t("Sign In")}
              </NavLink>
            </p>
          </form>
        )}

        {step === "emailOTP" && (
          <OTPVerification
            type="email"
            identifier={formData.email}
            onSuccess={handleEmailOTP}
            onBack={handleBack}
            formData={formData}
          />
        )}
        {step === "phoneOTP" && (
          <OTPVerification
            type="phone"
            identifier={`${formData.countryCode}${formData.phone}`}
            onSuccess={handlePhoneOTP}
            onBack={handleBack}
            formData={formData}
          />
        )}
        {step === "twoFactorOTP" && (
          <OTPVerification
            type="2fa"
            identifier={formData.email}
            onSuccess={handle2FAOTP}
            onBack={handleBack}
            formData={{ ...formData, userId }}
          />
        )}

        {step === "payment" && (
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg space-y-4">
            <div className="text-center mb-4">
              <img
                src={logo}
                alt="WealthyBridge Logo"
                className="h-12 mx-auto"
              />
              <h2 className="text-xl font-semibold mt-2">
                {t("Activation Fee Payment")}
              </h2>
            </div>

            {error && (
              <div className="text-red-500 p-2 bg-red-100 rounded">{error}</div>
            )}
            {success && (
              <div className="text-green-500 p-2 bg-green-100 rounded">
                {success}
              </div>
            )}
            {paymentRedirectUrl && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t("redirecting_to_payment")}
                </p>
                <a
                  href={paymentRedirectUrl}
                  className="text-blue-600 hover:underline"
                >
                  {t("click to continue")}
                </a>
              </div>
            )}

            {/* Fix: Add warning for adblockers blocking Stripe */}
            {["stripe", "mastercard", "googlepay"].includes(paymentMethod) && (
              <div className="text-yellow-600 p-2 bg-yellow-100 rounded">
                {t("disable_adblocker_for_stripe")}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("Select Your Payment Method")}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              >
                <option value="">{t("select payment method")}</option>
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
                placeholder="$5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
                min={5}
                step="1"
                required
              />
            </div>

            {["mpesa", "airtelmoney", "mtn", "tigopesa", "flutterwave"].includes(paymentMethod) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("Phone Number")}
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.trim())}
                  placeholder="+254791800900"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
                  pattern="^\+\d{10,14}$"
                  required
                />
              </div>
            )}

            {["stripe", "mastercard", "googlepay"].includes(paymentMethod) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("card_details")}
                </label>
                <div className="mt-1 block w-full p-2 border rounded-md">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#32325d",
                          "::placeholder": { color: "#aab7c4" },
                        },
                        invalid: { color: "#fa755a" },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {["paypal", "skrill", "flutterwave"].includes(paymentMethod) && (
              <p className="text-sm text-gray-600">
                {t("redirect_payment", { method: paymentMethod })}
              </p>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="w-full bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200"
                disabled={isSubmitting}
              >
                {t("Back")}
              </button>
              <button
                onClick={handlePayment}
                disabled={
                  isSubmitting ||
                  !paymentMethod ||
                  !verificationAmount ||
                  Number(verificationAmount) < 5
                }
                className={`w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors duration-200 ${
                  isSubmitting ||
                  !paymentMethod ||
                  Number(verificationAmount) < 5
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {isSubmitting ? t("processing") : t("Confirm Payment")}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default function WrappedSignUpForm() {
  return (
    <Elements stripe={stripePromise}>
      <SignUpForm />
    </Elements>
  );
}