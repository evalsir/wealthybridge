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
    countryCode: "", // ISO country code (e.g., KE)
    phoneCountryCode: "", // Phone country code (e.g., +254)
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

  // Comprehensive country list with ISO and phone codes
  const countryOptions = [
    { isoCode: "AL", phoneCode: "+355", label: "Albania (+355)" },
    { isoCode: "DZ", phoneCode: "+213", label: "Algeria (+213)" },
    { isoCode: "AD", phoneCode: "+376", label: "Andorra (+376)" },
    { isoCode: "AO", phoneCode: "+244", label: "Angola (+244)" },
    { isoCode: "AG", phoneCode: "+1-268", label: "Antigua and Barbuda (+1-268)" },
    { isoCode: "AR", phoneCode: "+54", label: "Argentina (+54)" },
    { isoCode: "AM", phoneCode: "+374", label: "Armenia (+374)" },
    { isoCode: "AU", phoneCode: "+61", label: "Australia (+61)" },
    { isoCode: "AT", phoneCode: "+43", label: "Austria (+43)" },
    { isoCode: "AZ", phoneCode: "+994", label: "Azerbaijan (+994)" },
    { isoCode: "BS", phoneCode: "+1-242", label: "Bahamas (+1-242)" },
    { isoCode: "BH", phoneCode: "+973", label: "Bahrain (+973)" },
    { isoCode: "BD", phoneCode: "+880", label: "Bangladesh (+880)" },
    { isoCode: "BB", phoneCode: "+1-246", label: "Barbados (+1-246)" },
    { isoCode: "BY", phoneCode: "+375", label: "Belarus (+375)" },
    { isoCode: "BE", phoneCode: "+32", label: "Belgium (+32)" },
    { isoCode: "BZ", phoneCode: "+501", label: "Belize (+501)" },
    { isoCode: "BJ", phoneCode: "+229", label: "Benin (+229)" },
    { isoCode: "BT", phoneCode: "+975", label: "Bhutan (+975)" },
    { isoCode: "BO", phoneCode: "+591", label: "Bolivia (+591)" },
    { isoCode: "BA", phoneCode: "+387", label: "Bosnia and Herzegovina (+387)" },
    { isoCode: "BW", phoneCode: "+267", label: "Botswana (+267)" },
    { isoCode: "BR", phoneCode: "+55", label: "Brazil (+55)" },
    { isoCode: "BN", phoneCode: "+673", label: "Brunei (+673)" },
    { isoCode: "BG", phoneCode: "+359", label: "Bulgaria (+359)" },
    { isoCode: "BF", phoneCode: "+226", label: "Burkina Faso (+226)" },
    { isoCode: "BI", phoneCode: "+257", label: "Burundi (+257)" },
    { isoCode: "KH", phoneCode: "+855", label: "Cambodia (+855)" },
    { isoCode: "CM", phoneCode: "+237", label: "Cameroon (+237)" },
    { isoCode: "CA", phoneCode: "+1", label: "Canada (+1)" },
    { isoCode: "CV", phoneCode: "+238", label: "Cape Verde (+238)" },
    { isoCode: "CL", phoneCode: "+56", label: "Chile (+56)" },
    { isoCode: "CO", phoneCode: "+57", label: "Colombia (+57)" },
    { isoCode: "KM", phoneCode: "+269", label: "Comoros (+269)" },
    { isoCode: "CR", phoneCode: "+506", label: "Costa Rica (+506)" },
    { isoCode: "HR", phoneCode: "+385", label: "Croatia (+385)" },
    { isoCode: "CY", phoneCode: "+357", label: "Cyprus (+357)" },
    { isoCode: "CZ", phoneCode: "+420", label: "Czech Republic (+420)" },
    { isoCode: "CD", phoneCode: "+243", label: "Democratic Republic of the Congo (+243)" },
    { isoCode: "DK", phoneCode: "+45", label: "Denmark (+45)" },
    { isoCode: "DJ", phoneCode: "+253", label: "Djibouti (+253)" },
    { isoCode: "DM", phoneCode: "+1-767", label: "Dominica (+1-767)" },
    { isoCode: "DO", phoneCode: "+1-809", label: "Dominican Republic (+1-809)" },
    { isoCode: "EC", phoneCode: "+593", label: "Ecuador (+593)" },
    { isoCode: "EG", phoneCode: "+20", label: "Egypt (+20)" },
    { isoCode: "SV", phoneCode: "+503", label: "El Salvador (+503)" },
    { isoCode: "EE", phoneCode: "+372", label: "Estonia (+372)" },
    { isoCode: "SZ", phoneCode: "+268", label: "Eswatini (+268)" },
    { isoCode: "ET", phoneCode: "+251", label: "Ethiopia (+251)" },
    { isoCode: "FJ", phoneCode: "+679", label: "Fiji (+679)" },
    { isoCode: "FI", phoneCode: "+358", label: "Finland (+358)" },
    { isoCode: "FR", phoneCode: "+33", label: "France (+33)" },
    { isoCode: "GA", phoneCode: "+241", label: "Gabon (+241)" },
    { isoCode: "GM", phoneCode: "+220", label: "Gambia (+220)" },
    { isoCode: "GE", phoneCode: "+995", label: "Georgia (+995)" },
    { isoCode: "DE", phoneCode: "+49", label: "Germany (+49)" },
    { isoCode: "GH", phoneCode: "+233", label: "Ghana (+233)" },
    { isoCode: "GR", phoneCode: "+30", label: "Greece (+30)" },
    { isoCode: "GD", phoneCode: "+1-473", label: "Grenada (+1-473)" },
    { isoCode: "GT", phoneCode: "+502", label: "Guatemala (+502)" },
    { isoCode: "GN", phoneCode: "+224", label: "Guinea (+224)" },
    { isoCode: "GW", phoneCode: "+245", label: "Guinea-Bissau (+245)" },
    { isoCode: "GY", phoneCode: "+592", label: "Guyana (+592)" },
    { isoCode: "HN", phoneCode: "+504", label: "Honduras (+504)" },
    { isoCode: "HK", phoneCode: "+852", label: "Hong Kong (+852)" },
    { isoCode: "HU", phoneCode: "+36", label: "Hungary (+36)" },
    { isoCode: "IS", phoneCode: "+354", label: "Iceland (+354)" },
    { isoCode: "IN", phoneCode: "+91", label: "India (+91)" },
    { isoCode: "ID", phoneCode: "+62", label: "Indonesia (+62)" },
    { isoCode: "IE", phoneCode: "+353", label: "Ireland (+353)" },
    { isoCode: "IL", phoneCode: "+972", label: "Israel (+972)" },
    { isoCode: "IT", phoneCode: "+39", label: "Italy (+39)" },
    { isoCode: "JM", phoneCode: "+1-876", label: "Jamaica (+1-876)" },
    { isoCode: "JP", phoneCode: "+81", label: "Japan (+81)" },
    { isoCode: "JO", phoneCode: "+962", label: "Jordan (+962)" },
    { isoCode: "KZ", phoneCode: "+7", label: "Kazakhstan (+7)" },
    { isoCode: "KE", phoneCode: "+254", label: "Kenya (+254)" },
    { isoCode: "KW", phoneCode: "+965", label: "Kuwait (+965)" },
    { isoCode: "KG", phoneCode: "+996", label: "Kyrgyzstan (+996)" },
    { isoCode: "LA", phoneCode: "+856", label: "Laos (+856)" },
    { isoCode: "LV", phoneCode: "+371", label: "Latvia (+371)" },
    { isoCode: "LB", phoneCode: "+961", label: "Lebanon (+961)" },
    { isoCode: "LS", phoneCode: "+266", label: "Lesotho (+266)" },
    { isoCode: "LR", phoneCode: "+231", label: "Liberia (+231)" },
    { isoCode: "LI", phoneCode: "+423", label: "Liechtenstein (+423)" },
    { isoCode: "LT", phoneCode: "+370", label: "Lithuania (+370)" },
    { isoCode: "LU", phoneCode: "+352", label: "Luxembourg (+352)" },
    { isoCode: "MG", phoneCode: "+261", label: "Madagascar (+261)" },
    { isoCode: "MW", phoneCode: "+265", label: "Malawi (+265)" },
    { isoCode: "MY", phoneCode: "+60", label: "Malaysia (+60)" },
    { isoCode: "MV", phoneCode: "+960", label: "Maldives (+960)" },
    { isoCode: "ML", phoneCode: "+223", label: "Mali (+223)" },
    { isoCode: "MT", phoneCode: "+356", label: "Malta (+356)" },
    { isoCode: "MR", phoneCode: "+222", label: "Mauritania (+222)" },
    { isoCode: "MU", phoneCode: "+230", label: "Mauritius (+230)" },
    { isoCode: "MX", phoneCode: "+52", label: "Mexico (+52)" },
    { isoCode: "MD", phoneCode: "+373", label: "Moldova (+373)" },
    { isoCode: "MC", phoneCode: "+377", label: "Monaco (+377)" },
    { isoCode: "MN", phoneCode: "+976", label: "Mongolia (+976)" },
    { isoCode: "ME", phoneCode: "+382", label: "Montenegro (+382)" },
    { isoCode: "MA", phoneCode: "+212", label: "Morocco (+212)" },
    { isoCode: "MZ", phoneCode: "+258", label: "Mozambique (+258)" },
    { isoCode: "NA", phoneCode: "+264", label: "Namibia (+264)" },
    { isoCode: "NP", phoneCode: "+977", label: "Nepal (+977)" },
    { isoCode: "NL", phoneCode: "+31", label: "Netherlands (+31)" },
    { isoCode: "NZ", phoneCode: "+64", label: "New Zealand (+64)" },
    { isoCode: "NI", phoneCode: "+505", label: "Nicaragua (+505)" },
    { isoCode: "NE", phoneCode: "+227", label: "Niger (+227)" },
    { isoCode: "NG", phoneCode: "+234", label: "Nigeria (+234)" },
    { isoCode: "MK", phoneCode: "+389", label: "North Macedonia (+389)" },
    { isoCode: "NO", phoneCode: "+47", label: "Norway (+47)" },
    { isoCode: "OM", phoneCode: "+968", label: "Oman (+968)" },
    { isoCode: "PK", phoneCode: "+92", label: "Pakistan (+92)" },
    { isoCode: "PA", phoneCode: "+507", label: "Panama (+507)" },
    { isoCode: "PG", phoneCode: "+675", label: "Papua New Guinea (+675)" },
    { isoCode: "PY", phoneCode: "+595", label: "Paraguay (+595)" },
    { isoCode: "PE", phoneCode: "+51", label: "Peru (+51)" },
    { isoCode: "PH", phoneCode: "+63", label: "Philippines (+63)" },
    { isoCode: "PL", phoneCode: "+48", label: "Poland (+48)" },
    { isoCode: "PT", phoneCode: "+351", label: "Portugal (+351)" },
    { isoCode: "QA", phoneCode: "+974", label: "Qatar (+974)" },
    { isoCode: "RO", phoneCode: "+40", label: "Romania (+40)" },
    { isoCode: "RU", phoneCode: "+7", label: "Russia (+7)" },
    { isoCode: "RW", phoneCode: "+250", label: "Rwanda (+250)" },
    { isoCode: "KN", phoneCode: "+1-869", label: "Saint Kitts and Nevis (+1-869)" },
    { isoCode: "LC", phoneCode: "+1-758", label: "Saint Lucia (+1-758)" },
    { isoCode: "VC", phoneCode: "+1-784", label: "Saint Vincent and the Grenadines (+1-784)" },
    { isoCode: "WS", phoneCode: "+685", label: "Samoa (+685)" },
    { isoCode: "SM", phoneCode: "+378", label: "San Marino (+378)" },
    { isoCode: "ST", phoneCode: "+239", label: "Sao Tome and Principe (+239)" },
    { isoCode: "SA", phoneCode: "+966", label: "Saudi Arabia (+966)" },
    { isoCode: "SN", phoneCode: "+221", label: "Senegal (+221)" },
    { isoCode: "RS", phoneCode: "+381", label: "Serbia (+381)" },
    { isoCode: "SC", phoneCode: "+248", label: "Seychelles (+248)" },
    { isoCode: "SL", phoneCode: "+232", label: "Sierra Leone (+232)" },
    { isoCode: "SG", phoneCode: "+65", label: "Singapore (+65)" },
    { isoCode: "SK", phoneCode: "+421", label: "Slovakia (+421)" },
    { isoCode: "SI", phoneCode: "+386", label: "Slovenia (+386)" },
    { isoCode: "ZA", phoneCode: "+27", label: "South Africa (+27)" },
    { isoCode: "KR", phoneCode: "+82", label: "South Korea (+82)" },
    { isoCode: "ES", phoneCode: "+34", label: "Spain (+34)" },
    { isoCode: "LK", phoneCode: "+94", label: "Sri Lanka (+94)" },
    { isoCode: "SR", phoneCode: "+597", label: "Suriname (+597)" },
    { isoCode: "SE", phoneCode: "+46", label: "Sweden (+46)" },
    { isoCode: "CH", phoneCode: "+41", label: "Switzerland (+41)" },
    { isoCode: "TW", phoneCode: "+886", label: "Taiwan (+886)" },
    { isoCode: "TJ", phoneCode: "+992", label: "Tajikistan (+992)" },
    { isoCode: "TZ", phoneCode: "+255", label: "Tanzania (+255)" },
    { isoCode: "TH", phoneCode: "+66", label: "Thailand (+66)" },
    { isoCode: "TG", phoneCode: "+228", label: "Togo (+228)" },
    { isoCode: "TT", phoneCode: "+1-868", label: "Trinidad and Tobago (+1-868)" },
    { isoCode: "TN", phoneCode: "+216", label: "Tunisia (+216)" },
    { isoCode: "TR", phoneCode: "+90", label: "Turkey (+90)" },
    { isoCode: "UG", phoneCode: "+256", label: "Uganda (+256)" },
    { isoCode: "UA", phoneCode: "+380", label: "Ukraine (+380)" },
    { isoCode: "AE", phoneCode: "+971", label: "United Arab Emirates (+971)" },
    { isoCode: "GB", phoneCode: "+44", label: "United Kingdom (+44)" },
    { isoCode: "US", phoneCode: "+1", label: "United States (+1)" },
    { isoCode: "UY", phoneCode: "+598", label: "Uruguay (+598)" },
    { isoCode: "UZ", phoneCode: "+998", label: "Uzbekistan (+998)" },
    { isoCode: "VU", phoneCode: "+678", label: "Vanuatu (+678)" },
    { isoCode: "VN", phoneCode: "+84", label: "Vietnam (+84)" },
    { isoCode: "ZM", phoneCode: "+260", label: "Zambia (+260)" },
    { isoCode: "ZW", phoneCode: "+263", label: "Zimbabwe (+263)" },
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
    if (name === "countryCode") {
      const selectedCountry = countryOptions.find(c => c.isoCode === value);
      setFormData((prevData) => ({
        ...prevData,
        countryCode: value,
        phoneCountryCode: selectedCountry ? selectedCountry.phoneCode : prevData.phoneCountryCode,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value.trim(),
      }));
    }
  };

  //adjusted
const handleCheckUserStatus = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);
  setError("");
  setSuccess("");

  // ✅ Validation section (unchanged except added phoneCountryCode check)
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
  if (!formData.countryCode) {
    setError(t("country required")); // ISO country code e.g., "KE"
    setIsSubmitting(false);
    return;
  }
  if (!formData.phoneCountryCode) {
    setError(t("phone country code required")); // Added new check for +254
    setIsSubmitting(false);
    return;
  }
  if (!countryCodeRegex.test(formData.phoneCountryCode)) {
    setError(t("invalid_country_code")); // e.g., must match +xxx format
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

  // ✅ Log the correct data being sent
  console.log("Checking user status:", {
    email: formData.email,
    phone: formData.phone,
    phoneCountryCode: formData.phoneCountryCode, // Changed from countryCode to correct field
    countryCode: formData.countryCode // Added ISO country code explicitly
  });

  try {
    // ✅ FIX: Send both ISO countryCode and phoneCountryCode instead of mixing them up
    const res = await checkUserStatus({
      email: formData.email,
      phone: formData.phone,
      phoneCountryCode: formData.phoneCountryCode, // e.g., +254
      countryCode: formData.countryCode // e.g., KE
    });

    console.log("Check user response:", res.data);

    if (res.status === 200) {
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      setUserId(res.data.userId);

      // ✅ Keep the original logic for handling different messages
      if (res.data.message === "email_otp_resent") {
        setSuccess(t("otp.email_otp_resent"));
        setStep("emailOTP");
      } else if (res.data.message === "phone_otp_resent") {
        setSuccess(t("otp.phone_otp_resent"));
        setStep("phoneOTP");
      } else if (res.data.message === "payment_required") {
        setSuccess(
          t("You are already registered and your account is active. Please proceed to pay the activation fee to complete registration.")
        );
        setStep("payment");
      } else if (res.data.message === "user_verified") {
        setSuccess(t("user_already_verified"));
        navigate("/signin");
      } else {
        setError(t("unexpected_response"));
      }
    } else if (res.status === 404) {
      console.log("User not found, proceeding to signup");
      await handleSubmit(e); // ✅ Original logic preserved
    } else {
      setError(t(res.data.message || "unexpected_response"));
    }
  } catch (error) {
    console.error("Check user error:", error);
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
          localStorage.setItem("token", res.data.token);
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
            countryCode: formData.phoneCountryCode,
          });
          console.log("Check user status after user_exists:", statusRes.data);
          if (statusRes.data.token) {
            localStorage.setItem("token", statusRes.data.token);
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
          console.error("Check user status error after user_exists:", statusError);
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
      console.log("Ignoring duplicate OTP submission for email:", formData.email);
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
      console.error("Email OTP verification error:", error);
      if (error.details === "no_otp_record") {
        console.log("No OTP record found, checking user status to confirm verification");
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.phoneCountryCode,
          });
          console.log("Post-OTP user status:", statusRes.data);
          if (statusRes.status === 200 && statusRes.data.message === "phone_otp_resent") {
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
          console.error("Post-OTP user status check error:", statusError);
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
      console.log("Ignoring duplicate OTP submission for phone:", formData.phone);
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    console.log("Submitting phone OTP:", {
      phone: formData.phone,
      countryCode: formData.phoneCountryCode,
      code: otp,
    });
    try {
      const res = await VerifyPhoneOTP({
        phone: formData.phone,
        countryCode: formData.phoneCountryCode,
        code: otp,
      });
      console.log("Phone OTP response:", res.data);
      if (res.status === 200) {
        setSuccess(
          t(res.data.message || "Your phone number has been successfully verified. Please proceed with the activation fee payment below.")
        );
        setStep(formData.enable2FA ? "twoFactorOTP" : "payment");
      }
    } catch (error) {
      console.error("Phone OTP verification error:", error);
      if (error.details === "no_otp_record") {
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.phoneCountryCode,
          });
          console.log("Post-OTP user status:", statusRes.data);
          if (statusRes.status === 200 && statusRes.data.message === "payment_required") {
            setSuccess(t("Your phone number has been successfully verified. Please proceed with the activation fee payment below."));
            setStep("payment");
          } else if (statusRes.data.message === "user_verified") {
            setSuccess(t("user_already_verified"));
            navigate("/signin");
          } else {
            setError(t("otp.phone_otp_failed") + " " + t("no_otp_record"));
          }
        } catch (statusError) {
          console.error("Post-OTP user status check error:", statusError);
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
      console.error("2FA OTP verification error:", error);
      if (error.details === "no_otp_record") {
        try {
          const statusRes = await checkUserStatus({
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.phoneCountryCode,
          });
          console.log("Post-OTP user status:", statusRes.data);
          if (statusRes.status === 200 && statusRes.data.message === "payment_required") {
            setSuccess(t("otp.2fa_setup_complete"));
            setStep("payment");
          } else if (statusRes.data.message === "user_verified") {
            setSuccess(t("user_already_verified"));
            navigate("/signin");
          } else {
            setError(t("otp.2fa_otp_failed") + " " + t("no_otp_record"));
          }
        } catch (statusError) {
          console.error("Post-OTP user status check error:", statusError);
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

    const selectedMethod = paymentMethods.find((m) => m.value === paymentMethod);
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
      phoneNumber: phoneNumber || `${formData.phoneCountryCode}${formData.phone}`,
      isVerificationFee: true,
    };

    if (["mpesa", "airtelmoney", "mtn", "tigopesa", "flutterwave"].includes(paymentMethod)) {
      if (!paymentData.phoneNumber.match(/^\+\d{10,14}$/)) {
        setError(t("invalid_phone"));
        setIsSubmitting(false);
        return;
      }
    }

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
            countryCode: "",
            phoneCountryCode: "",
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
      console.error(`Payment error for ${paymentMethod}:`, error);
      if (error.message === "route_not_found") {
        setError(t("payment_method_unavailable", { method: paymentMethod }));
      } else {
        setError(t(error.message || "payment_verification_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentCallback = async ({ userId, paymentMethod, transactionId }) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await processVerificationPayment(`callback/${paymentMethod}`, {
        userId,
        transactionId,
        email: formData.email,
        name: `${formData.firstName} ${formData.secondName}`,
        phoneNumber: `${formData.phoneCountryCode}${formData.phone}`,
      });
      console.log("Payment callback response:", res.data);
      if (res.status === 200) {
        setSuccess(t(res.data.message || "payment_verified"));
        setFormData({
          firstName: "",
          secondName: "",
          username: "",
          email: "",
          phone: "",
          countryCode: "",
          phoneCountryCode: "",
          password: "",
          referral: "",
          termsAccepted: false,
          enable2FA: false,
        });
        navigate("/signin");
      }
    } catch (error) {
      console.error("Payment callback error:", error);
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
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
              >
                <option value="">{t("Select Country")}</option>
                {countryOptions.map((country) => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                {t("Phone Number")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="phoneCountryCode"
                  name="phoneCountryCode"
                  value={formData.phoneCountryCode}
                  readOnly
                  className="mt-1 w-1/4 rounded-md border-gray-300 shadow-sm p-2 bg-gray-100"
                />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("e.g 7923458678")}
                  pattern="[0-9]{9,15}"
                  minLength={9}
                  maxLength={15}
                  className="mt-1 block w-3/4 rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
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
                placeholder={t("")}
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
                  isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
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
            identifier={`${formData.phoneCountryCode}${formData.phone}`}
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
                  placeholder={`${formData.phoneCountryCode}${formData.phone}`}
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