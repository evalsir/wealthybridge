// src/pages/Dashboard/DashboardLayout.jsx
import React, { useState, useContext, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiMenu, FiX } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Home" }, // Added Home link
  { to: "", label: "Overview" },
  { to: "buy", label: "Buy Shares" },
  { to: "withdraw", label: "Withdraw Funds" },
  { to: "earnings", label: "Earnings" },
  { to: "history", label: "History" },
  { to: "manage-investments", label: "Manage Investments" },
  { to: "profile", label: "Profile" },
  { to: "support", label: "Support" },
];

const DashboardLayout = () => {
  const { t } = useTranslation();
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      console.log("No user in DashboardLayout, redirecting to /signin");
      navigate("/signin", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
      className={`${
          sidebarOpen ? "block" : "hidden"
        } fixed inset-0 z-40 md:static md:block w-64 bg-blue-900 text-white`}
      >
        <div className="p-4 text-xl font-bold border-b border-blue-700">
          WealthyBridge
        </div>
        <nav className="p-4 flex flex-col gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ""} // Ensure exact match for Overview
              className={({ isActive }) =>
                `block px-3 py-2 rounded hover:bg-blue-700 transition ${
                  isActive ? "bg-blue-700" : ""
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
                {t(`${link.label.replace(" ", " ")}`) || link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md p-4 flex items-center justify-between md:justify-end">
          <button
            className="md:hidden text-blue-900 text-2xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="text-sm text-gray-600 hidden md:block">
            {t("logged In As")}{" "}
            <span className="font-semibold">{user.name || "User"}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;