// src/pages/Dashboard/Buyshares.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { createInvestment, processVerificationPayment } from '../../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const investmentPlans = [
  {
    planKey: 'basic_1m',
    displayName: 'Basic 1 Month',
    duration: 28,
    profit: 13,
    sharesRange: [1, 100],
    minInvestment: 50,
    maxInvestment: 5000,
  },
  {
    planKey: 'basic_2m',
    displayName: 'Basic 2 Months',
    duration: 56,
    profit: 22,
    sharesRange: [2, 200],
    minInvestment: 50,
    maxInvestment: 10000,
  },
  {
    planKey: 'premium_3m',
    displayName: 'Premium 3 Months',
    duration: 84,
    profit: 27,
    sharesRange: [6, 300],
    minInvestment: 300,
    maxInvestment: 15000,
  },
  {
    planKey: 'premium_6m',
    displayName: 'Premium 6 Months',
    duration: 172,
    profit: 33,
    sharesRange: [10, 500],
    minInvestment: 500,
    maxInvestment: 25000,
  },
  {
    planKey: 'super_9m',
    displayName: 'Super 9 Months',
    duration: 260,
    profit: 39,
    sharesRange: [30, 1000],
    minInvestment: 1500,
    maxInvestment: 50000,
  },
  {
    planKey: 'super_12m',
    displayName: 'Super 12 Months',
    duration: 348,
    profit: 45,
    sharesRange: [50, 2000],
    minInvestment: 2500,
    maxInvestment: 100000,
  },
];

const paymentMethods = [
  { value: 'paypal', label: 'PayPal', redirect: true },
  { value: 'stripe', label: 'Stripe', redirect: false },
  { value: 'mpesa', label: 'M-Pesa', redirect: false },
  { value: 'airtelmoney', label: 'Airtel Money', redirect: false },
  { value: 'mtn', label: 'MTN', redirect: false },
  { value: 'tigopesa', label: 'Tigo Pesa', redirect: false },
  { value: 'skrill', label: 'Skrill', redirect: true },
  { value: 'flutterwave', label: 'Flutterwave', redirect: true },
  { value: 'googlepay', label: 'Google Pay', redirect: false },
  { value: 'mastercard', label: 'Mastercard', redirect: false },
];

const PaymentForm = ({
  selectedPlan,
  shares,
  setShares,
  paymentMethod,
  setPaymentMethod,
  phoneNumber,
  setPhoneNumber,
  error,
  setError,
  user,
  navigate,
}) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const isMobilePayment = paymentMethod && ['mpesa', 'airtelmoney', 'mtn', 'tigopesa', 'flutterwave'].includes(paymentMethod);
  const isCardPayment = paymentMethod && ['stripe', 'googlepay', 'mastercard'].includes(paymentMethod);
  const isRedirectPayment = paymentMethod && ['paypal', 'skrill', 'flutterwave'].includes(paymentMethod);

  // Validate phone number for mobile payments
  const validatePhoneNumber = (number) => {
    if (!number) return false;
    const phoneRegex = /^\+\d{10,14}$/;
    return phoneRegex.test(number);
  };

  const handleInvest = async () => {
    if (!user) {
      setError(t('please_login'));
      navigate('/login', { state: { plan: selectedPlan.planKey } });
      return;
    }

    if (!user.hasPaidVerificationFee) {
      setError(t('verification_fee_required'));
      navigate('/signup', { state: { plan: selectedPlan.planKey } });
      return;
    }

    if (!selectedPlan) {
      setError(t('no_plan_selected'));
      return;
    }

    const [min, max] = selectedPlan.sharesRange;
    const value = Number(shares);

    if (!value || value < min || value > max) {
      setError(t('invalid_shares_range', { min, max }));
      return;
    }

    if (!paymentMethod) {
      setError(t('payment_method_required'));
      return;
    }

    if (isMobilePayment && !validatePhoneNumber(phoneNumber)) {
      setError(t('invalid_phone'));
      return;
    }

    const amount = 50 * value;
    if (amount < selectedPlan.minInvestment || amount > selectedPlan.maxInvestment) {
      setError(t('invalid_investment_amount', { min: selectedPlan.minInvestment, max: selectedPlan.maxInvestment }));
      return;
    }

    const paymentName = user.name?.trim();
    if (!paymentName) {
      setError(t('profile_name_required'));
      navigate('/profile', { state: { plan: selectedPlan.planKey } });
      return;
    }

    let paymentToken;
    if (isCardPayment) {
      if (!stripe || !elements) {
        setError(t('stripe_not_initialized'));
        return;
      }
      try {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError(t('card_input_missing'));
          return;
        }
        const { token, error } = await stripe.createToken(cardElement);
        if (error) {
          setError(t(error.message));
          return;
        }
        paymentToken = token.id;
      } catch (error) {
        setError(t('payment_token_failed'));
        return;
      }
    } else if (isRedirectPayment) {
      try {
        const paymentData = {
          userId: user._id,
          amount,
          email: user.email,
          name: paymentName,
          phoneNumber: phoneNumber || user.phoneNumber,
          isSharePurchase: true,
          plan: selectedPlan.planKey,
        };
        console.log('Initiating redirect payment:', paymentData);
        const res = await processVerificationPayment(`${paymentMethod}/initiate`, paymentData);
        console.log('Payment initiation response:', res.data);
        if (res.status === 200 && res.data.redirectUrl) {
          window.location.href = res.data.redirectUrl;
          return;
        } else {
          setError(t(res.data.message || 'payment_initiation_failed'));
          return;
        }
      } catch (error) {
        console.error('Redirect payment error:', error.response?.data || error.message);
        setError(t(error.response?.data?.message || 'payment_initiation_failed'));
        return;
      }
    }

    try {
      const investmentData = {
        plan: selectedPlan.planKey,
        shares: value,
        amount,
        paymentMethod,
        paymentName: paymentName.toLowerCase(),
        phoneNumber: isMobilePayment ? phoneNumber : undefined,
        paymentToken: paymentToken || undefined,
        referralCode: user.referralCode || undefined,
      };
      console.log('Sending investment data:', investmentData);
      const res = await createInvestment(investmentData);
      console.log('Investment response:', res.data);
      if (res.status === 201) {
        setError('');
        navigate('/subscription');
      } else {
        setError(t(res.data?.message || 'investment_failed'));
      }
    } catch (error) {
      console.error('createInvestment error:', error.response?.data || error.message);
      if (error.response?.status === 400 && error.response?.data?.message === 'payment_name_mismatch') {
        setError(t('payment_name_mismatch'));
        navigate('/profile', { state: { plan: selectedPlan.planKey } });
      } else {
        const errorMessage = error.response?.data?.message || 'investment_failed';
        const errorCode = error.response?.data?.errorCode ? ` (${error.response.data.errorCode})` : '';
        setError(t(`${errorMessage}${errorCode}`));
      }
    }
  };

  const calculateProfit = () => {
    const value = Number(shares);
    if (!selectedPlan || isNaN(value)) return '0.00';
    return (50 * value * (selectedPlan.profit / 100)).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="border p-6 rounded-lg shadow-md bg-white">
        <h3 className="text-2xl font-semibold text-blue-600 mb-4">{selectedPlan.displayName}</h3>
        <p className="text-gray-600">Duration: {selectedPlan.duration} days</p>
        <p className="text-gray-600">Profit Rate: {selectedPlan.profit}%</p>
        <p className="text-sm text-gray-500 mt-2">
          Shares range: {selectedPlan.sharesRange[0]} to {selectedPlan.sharesRange[1]}
        </p>
        <p className="text-sm text-gray-500">
          Investment range: ${selectedPlan.minInvestment} to ${selectedPlan.maxInvestment}
        </p>
        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">{t('shares')}</span>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('enter_shares_range', { min: selectedPlan.sharesRange[0], max: selectedPlan.sharesRange[1] })}
          />
        </label>
        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">{t('payment_method')}</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('select_payment_method')}</option>
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>
        {isMobilePayment && (
          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700">{t('phone_number')}</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('enter_phone_example')}
            />
          </label>
        )}
        {isCardPayment && (
          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700">{t('card_details')}</span>
            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#32325d',
                      '::placeholder': { color: '#aab7c4' },
                    },
                    invalid: { color: '#fa755a' },
                  },
                }}
              />
            </div>
          </label>
        )}
        {isRedirectPayment && (
          <p className="mt-4 text-sm text-gray-600">{t('redirect_payment', { method: paymentMethod })}</p>
        )}
        <p className="mt-4 text-lg font-semibold text-gray-800">
          {t('investment_amount')}: ${(50 * Number(shares)).toFixed(2)}
        </p>
        <p className="mt-2 text-lg font-semibold text-gray-800">
          {t('expected_profit')}: ${calculateProfit()}
        </p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleInvest}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            disabled={isCardPayment && !stripe}
          >
            {t('confirm_subscription')}
          </button>
          <button
            onClick={() => setSelectedPlan(null)}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200"
          >
            {t('change_plan')}
          </button>
        </div>
      </div>
    </div>
  );
};

const BuyShares = () => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [shares, setShares] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    console.log('BuyShares user:', user);
    const { plan } = location.state || {};
    if (plan) {
      const planData = investmentPlans.find((p) => p.planKey === plan);
      if (planData) {
        setSelectedPlan(planData);
      } else {
        setError(t('invalid_plan'));
      }
    }
    if (user?.preferredPaymentMethod) {
      setPaymentMethod(user.preferredPaymentMethod);
    }
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && ['stripe', 'googlepay', 'mastercard'].includes(paymentMethod)) {
      setError(t('stripe_config_missing'));
    }
  }, [location.state, user, paymentMethod, t]);

  const handleSelect = (plan) => {
    setSelectedPlan(plan);
    setError('');
    setShares('');
    setPaymentMethod(user?.preferredPaymentMethod || '');
    setPhoneNumber('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">{t('select_subscription_plan')}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!selectedPlan ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {investmentPlans.map((plan, i) => (
            <div
              key={i}
              className="border border-gray-300 rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <h3 className="text-xl font-bold text-blue-600">{plan.displayName}</h3>
              <p className="text-gray-600 mt-2">{t('duration')}: {plan.duration} {t('days')}</p>
              <p className="text-gray-600">{t('profit')}: {plan.profit}%</p>
              <button
                onClick={() => handleSelect(plan)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                {t('select_plan')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Elements stripe={stripePromise}>
          <PaymentForm
            selectedPlan={selectedPlan}
            shares={shares}
            setShares={setShares}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            error={error}
            setError={setError}
            user={user}
            navigate={navigate}
          />
        </Elements>
      )}
    </div>
  );
};

export default BuyShares;