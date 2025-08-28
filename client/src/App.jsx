// src/App.jsx
import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";

// Public layout and pages
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Blog from "./pages/Blog";
import History from "./pages/History";
import InvestmentPlan from "./pages/InvestmentPlan";
import WrappedPaymentPage from './pages/PaymentPage';
import WhyWealthyBridge from "./pages/WhyWealthyBridge";
import FAQ from "./pages/Faq";
import Legal from "./pages/Legal";
import ScrollToTop from "./components/Scroll/ScrollToTop";
import NoPage from "./pages/NoPage";

// Auth & Utility
import SignupPage from "./components/SignUpForm/SignUpForm.jsx";
import SignInPage from "./pages/SignInPage";
import ForgotPasswordForm from "./components/Password/ForgotPassword";

// User Dashboard pages
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import Overview from "./pages/Dashboard/Overview";
import BuyShares from "./pages/Dashboard/BuyShares";
import Withdraw from "./pages/Dashboard/Withdraw";
import Earnings from "./pages/Dashboard/Earnings";
import HistoryDashboard from "./pages/Dashboard/History";
import Profile from "./pages/Dashboard/Profile";
import Support from "./pages/Dashboard/Support";
import ManageInvestments from "./pages/Dashboard/ManageInvestments";

// 🔐 Admin Dashboard
import { AdminLayout } from "./admin/components/layout/AdminLayout";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminUsers from "./admin/pages/Users";
import AdminAnalytics from "./admin/pages/Analytics";
import AdminSettings from "./admin/pages/Settings";
import AdminTransactions from "./admin/pages/Transactions.jsx";
import AdminContentPage from "./admin/pages/Content.jsx";
import AdminProfile from "./admin/pages/Profile.jsx";
// Error Boundary
import ErrorBoundary from "./components/ErrorBoundary";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/signin" replace />;
};

const RedirectIfLoggedIn = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  return user ? (
    <Navigate
      to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
      replace
    />
  ) : (
    children
  );
};

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="services" element={<Services />} />
          <Route path="blog" element={<Blog />} />
          <Route path="history" element={<History />} />
          <Route path="plans" element={<InvestmentPlan />} />
           <Route path="/payment" element={<WrappedPaymentPage />} />
          <Route path="invest-now" element={<BuyShares />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="legal" element={<Legal />} />
          <Route path="why-wealthy-bridge" element={<WhyWealthyBridge />} />
          <Route path="forgot-password" element={<ForgotPasswordForm />} />
          <Route path="*" element={<NoPage />} />
        </Route>

        {/* AUTH ROUTES */}
        <Route
          path="/signup"
          element={
            <RedirectIfLoggedIn>
              <SignupPage />
            </RedirectIfLoggedIn>
          }
        />
        <Route
          path="/signin"
          element={
            <RedirectIfLoggedIn>
              <SignInPage />
            </RedirectIfLoggedIn>
          }
        />

        {/* USER DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="buy" element={<BuyShares />} />
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="earnings" element={<Earnings />} />
          <Route
            path="history"
            element={
              <ErrorBoundary>
                <HistoryDashboard />
              </ErrorBoundary>
            }
          />
          <Route path="profile" element={<Profile />} />
          <Route path="support" element={<Support />} />
          <Route path="manage-investments" element={<ManageInvestments />} />
        </Route>

        {/* 🔐 ADMIN DASHBOARD */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <AdminLayout>
              <AdminTransactions />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/content"
          element={
            <AdminLayout>
              <AdminContentPage />
            </AdminLayout>
          }
        />
        {/* ADMIN DASHBOARD (Protected) */}
        {/* <Route
          path="/admin"
          element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="testimonials" element={<ApproveTestimonials />} />
          <Route path="withdrawals" element={<ViewWithdrawals />} />
        </Route> */}
      </Routes>
    </AuthProvider>
  );
}

export default App;
