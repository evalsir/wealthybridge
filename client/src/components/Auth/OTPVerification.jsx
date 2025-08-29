
//src/components/Auth/OTPVerification.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ResendEmailOTP, ResendPhoneOTP, resend2FAOTP } from "../../utils/api";

const OTPVerification = ({ type, identifier, onSuccess, onBack, formData }) => {
  const { t } = useTranslation();
  const [otp, setOTP] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      let res;
      if (type === "email") {
        res = await ResendEmailOTP({
          email: formData.email,
          userId: formData.userId,
        });
      } else if (type === "phone") {
        res = await ResendPhoneOTP({
          phone: formData.phone,
          countryCode: formData.countryCode,
          userId: formData.userId,
        });
      } else if (type === "2fa") {
        res = await resend2FAOTP({ userId: formData.userId });
      }
      console.log(`Resend ${type} OTP response:`, res.data);
      setSuccess(
        t("OTP sent successfully. Kindly check your email to continue.")
      );
      setResendCooldown(60);
      if (process.env.NODE_ENV === "development" && res.data.otp) {
        console.log(`Development mode: ${type} OTP: ${res.data.otp}`);
      }
    } catch (error) {
      console.error(
        `Resend ${type} OTP error:`,
        error.response?.data || error.message
      );
      setError(t(error.response?.data?.message || "Failed to resend OTP. Please try again shortly"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log(`Ignoring duplicate OTP submission for ${type}:`, identifier);
      return;
    }
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError(t("Invalid OTP"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await onSuccess(otp, t("submitting"));
    } catch (error) {
      console.error(`Submit ${type} OTP error:`, error);
      // Error handling is done in onSuccess (handleEmailOTP, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">{t(`otp.${type}Title`)}</h2>
        <p className="text-sm text-gray-600">
          {type === "email"
            ? t("otp.instructionsemail")
            : type === "phone"
            ? t("otp.instructionsphone")
            : t("otp.instructions")}
        </p>
      </div>
      {error && (
        <div className="text-red-500 p-2 bg-red-100 rounded">{error}</div>
      )}
      {success && (
        <div className="text-green-500 p-2 bg-green-100 rounded">{success}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-gray-700"
          >
            {t("otp.code")}
          </label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOTP(e.target.value.trim())}
            placeholder="XXXXXX"
            maxLength={6}
            inputMode="numeric"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200"
            disabled={isSubmitting}
          >
            {t("Back")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className={`w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors duration-200 ${
              isSubmitting || otp.length !== 6
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            {isSubmitting ? t("otp.submitting") : t("otp.submit")}
          </button>
        </div>
      </form>
      <div className="text-center">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || isSubmitting}
          className={`text-blue-600 hover:underline ${
            resendCooldown > 0 || isSubmitting
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          {t("Resend OTP")}
        </button>
        {resendCooldown > 0 && (
          <p className="text-sm text-gray-600">
            {t("OTP sent successfully. Kindly check your email to continue", {
              seconds: resendCooldown,
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default OTPVerification;
