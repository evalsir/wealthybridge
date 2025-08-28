import React, { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { verify2FA } from "../utils/api";
import Navbar from "../components/Navbar/Navbar";
import logo from "../assets/logo.png";
import Footer from "../components/Footer/Footer";
import axios from "axios";

const SignInPage = () => {
  const { t } = useTranslation();
  const { login, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
    twoFactorCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      console.log("User already logged in, checking verification status", { user });
      checkUserVerificationStatus(user.usernameOrEmail || user.email);
    }
  }, [user, loading]);

  const checkUserVerificationStatus = async (usernameOrEmail) => {
    if (!usernameOrEmail) {
      console.error("No username or email provided for verification check");
      setError(t("signin.error"));
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      console.log("API URL:", apiUrl);
      const response = await axios.post(
        `${apiUrl}/api/auth/check-user`,
        { usernameOrEmail },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Verification status response:", response.data);
      setVerificationStatus(response.data);
      if (response.data.nextStep === "login") {
        console.log("User fully verified, navigating to dashboard");
        navigate(user.role === "admin" ? "/admin" : "/dashboard", {
          replace: true,
        });
      } else {
        redirectToNextStep(response.data.nextStep, response.data.userId, usernameOrEmail);
      }
    } catch (err) {
      console.error("Error checking user verification:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers,
      });
      setError(t("signin.error"));
    }
  };

  const redirectToNextStep = (nextStep, userId, usernameOrEmail) => {
    console.log("Redirecting to next step:", { nextStep, userId, usernameOrEmail });
    if (!userId || !usernameOrEmail) {
      console.error("Missing userId or usernameOrEmail for redirect", { userId, usernameOrEmail });
      setError(t("signin.error"));
      return;
    }
    const encodedIdentifier = encodeURIComponent(usernameOrEmail);
    let redirectUrl;
    switch (nextStep) {
      case "verify-email":
        redirectUrl = `/verify-email?userId=${userId}&usernameOrEmail=${encodedIdentifier}`;
        break;
      case "verify-phone":
        redirectUrl = `/verify-phone?userId=${userId}&usernameOrEmail=${encodedIdentifier}`;
        break;
      case "verify-payment":
        redirectUrl = `/payment?userId=${userId}&usernameOrEmail=${encodedIdentifier}`;
        break;
      default:
        console.error("Unknown next step:", nextStep);
        setError(t("signin.unknown_step"));
        return;
    }
    console.log("Attempting navigation to:", redirectUrl);
    try {
      navigate(redirectUrl, { replace: true });
      console.log("Navigation successful to:", redirectUrl);
    } catch (navError) {
      console.error("Navigation failed:", {
        redirectUrl,
        error: navError.message,
      });
      setError(t("signin.error"));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
//fixed
 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  if (!formData.usernameOrEmail || !formData.password) {
    setError(t("signin.invalid_credentials"));
    return;
  }
  try {
    console.log("Attempting login with:", { usernameOrEmail: formData.usernameOrEmail });
    const response = await login(
      formData.usernameOrEmail,
      formData.password,
      formData.twoFactorCode || undefined
    );
    console.log("Login response:", response);
    if (response.requires2FA && !formData.twoFactorCode) {
      console.log("2FA required, showing 2FA input");
      setShow2FA(true);
    } else if (response.user?.nextStep === "verify-payment") {
      console.log("Login response indicates payment verification needed", {
        userId: response.user?.id,
        usernameOrEmail: formData.usernameOrEmail,
      });
      redirectToNextStep("verify-payment", response.user?.id, formData.usernameOrEmail);
    } else {
      await checkUserVerificationStatus(formData.usernameOrEmail);
    }
  } catch (err) {
    console.error("Login error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      headers: err.response?.headers,
    });
    if (err.response?.status === 402 && err.response?.data?.nextStep) {
      console.log("402 error, redirecting based on nextStep", {
        nextStep: err.response.data.nextStep,
        userId: err.response.data.userId,
        usernameOrEmail: formData.usernameOrEmail,
      });
      setSuccess(t("signin.verification_required"));
      redirectToNextStep(err.response.data.nextStep, err.response.data.userId, formData.usernameOrEmail);
    } else {
      const errorMessage = err.response?.data?.message || err.message;
      setError(
        errorMessage === "Failed to fetch profile after login"
          ? t("signin.profile_fetch_failed")
          : errorMessage === "invalid_credentials"
          ? t("signin.invalid_credentials")
          : t("signin.error")
      );
    }
  }
};

//end of fix
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.twoFactorCode) {
      setError(t("signin.invalid_2fa_code"));
      return;
    }
    try {
      console.log("Attempting 2FA verification with:", {
        usernameOrEmail: formData.usernameOrEmail,
        code: formData.twoFactorCode,
      });
      const response = await verify2FA({
        usernameOrEmail: formData.usernameOrEmail,
        code: formData.twoFactorCode,
      });
      console.log("2FA verification response:", response);
      localStorage.setItem("token", response.token);
      const loginResponse = await login(
        formData.usernameOrEmail,
        null,
        formData.twoFactorCode
      );
      console.log("Post-2FA login response:", loginResponse);
      if (loginResponse.nextStep === "verify-payment") {
        console.log("Post-2FA login indicates payment verification needed", {
          userId: loginResponse.user?.id || loginResponse.userId,
          usernameOrEmail: formData.usernameOrEmail,
        });
        redirectToNextStep("verify-payment", loginResponse.user?.id || loginResponse.userId, formData.usernameOrEmail);
      } else {
        await checkUserVerificationStatus(formData.usernameOrEmail);
      }
    } catch (err) {
      console.error("2FA error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers,
      });
      if (err.response?.status === 402 && err.response?.data?.nextStep) {
        console.log("2FA 402 error, redirecting based on nextStep", {
          nextStep: err.response.data.nextStep,
          userId: err.response.data.userId,
          usernameOrEmail: formData.usernameOrEmail,
        });
        setSuccess(t("signin.verification_required"));
        redirectToNextStep(err.response.data.nextStep, err.response.data.userId, formData.usernameOrEmail);
      } else {
        const errorMessage = err.response?.data?.message || err.message;
        setError(
          errorMessage === "Failed to fetch profile after login"
            ? t("signin.profile_fetch_failed")
            : t("signin.invalid_2fa_code")
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <p className="text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-20 flex justify-center items-center min-h-screen bg-gray-100">
        <form
          onSubmit={show2FA ? handle2FASubmit : handleSubmit}
          className="max-w-md w-full p-6 bg-white rounded-lg shadow-md space-y-4"
        >
          <div className="flex justify-center">
            <NavLink to="/">
              <img src={logo} alt="Logo" className="h-12 w-auto" />
            </NavLink>
          </div>
          <h2 className="text-2xl font-semibold text-center text-gray-800">
            {t("signin.title")}
          </h2>
          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && <p className="text-green-500 text-center">{success}</p>}

          {!show2FA && (
            <>
              <div>
                <label
                  htmlFor="usernameOrEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("UsernameOrEmail")}
                </label>
                <input
                  type="text"
                  name="usernameOrEmail"
                  id="usernameOrEmail"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  placeholder={t("username or email")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("password")}
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("password")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  required
                />
              </div>
            </>
          )}

          {show2FA && (
            <div>
              <label
                htmlFor="twoFactorCode"
                className="block text-sm font-medium text-gray-700"
              >
                {t("signin.twoFactorCode")}
              </label>
              <input
                type="text"
                name="twoFactorCode"
                id="twoFactorCode"
                value={formData.twoFactorCode}
                onChange={handleChange}
                placeholder={t("signin.enter_two_factor_code")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-900 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-300 transition-colors duration-200 cursor-pointer"
          >
            {t("signin.submit")}
          </button>

          {!show2FA && (
            <div className="text-center text-sm text-gray-600 space-y-2">
              <p>
                {t("signin.noAccount")}
                <NavLink to="/signup" className="text-blue-600 hover:underline">
                  {t("signin.signup")}
                </NavLink>
              </p>
              <p>
                <NavLink
                  to="/forgot-password"
                  className="text-blue-600 hover:underline"
                >
                  {t("signin.forgotPassword")}
                </NavLink>
              </p>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </>
  );
};

export default SignInPage;