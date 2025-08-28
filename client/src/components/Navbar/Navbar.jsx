// src/components/Navbar/Navbar.jsx
import React, { useState, useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin', { replace: true });
      setIsOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/signin', { replace: true });
      setIsOpen(false);
    }
  };

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/plans', label: t('nav.investments') },
    { to: '/about', label: t('nav.about') },
    { to: '/legal', label: t('nav.legal') },
    { to: '/faq', label: t('nav.faq') },
    ...(user && user.role !== 'admin' ? [{ to: '/dashboard', label: t('nav.dashboard') }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: t('nav.admin') }] : []),
  ];

  return (
    <div className="fixed top-0 right-0 w-full bg-white text-black shadow-md z-50">
      <div className="w-full bg-blue-950 text-white text-sm py-2">
        <div className="w-[80%] mx-auto overflow-hidden ticker-container">
          <div className="ticker-content hover:paused cursor-alias">
            <span>📢 {t('nav.ticker.welcome')}</span>
            <span>💰 {t('nav.ticker.returns')}</span>
            <span>📈 {t('nav.ticker.roi')}</span>
            <span>🎯 {t('nav.ticker.refer')}</span>
          </div>
        </div>
      </div>
      <div className="w-full md:w-[80%] mx-auto flex justify-between items-center px-4 sm:px-6 py-4 bg-white relative">
        <Link to="/" className="flex items-center gap-1">
          <img src={logo} alt="WealthyBridge logo" className="h-10 sm:h-12" />
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-850 tracking-wide">
            Wealthy<span className="text-blue-900">Bridge</span>
          </span>
        </Link>
        <button
          className="text-2xl md:hidden focus:outline-none"
          onClick={toggleMenu}
        >
          {isOpen ? '✕' : '☰'}
        </button>
        <div className="hidden md:flex items-center gap-6">
          <nav>
            <ul className="flex items-center gap-6 text-sm font-medium">
              {navItems.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => window.scrollTo(0, 0)}
                    className={({ isActive }) =>
                      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <select
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-blue-800 text-white rounded-md px-2 py-2.5 focus:outline-none"
            defaultValue={i18n.language}
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
            <option value="es">Spanish</option>
            <option value="nl">Dutch</option>
            <option value="ja">Japanese</option>
            <option value="pl">Polish</option>
            <option value="fr">French</option>
          </select>
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              {t('signout.title')}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/signin')}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-300 active:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                {t('signin.title')}
              </button>
              <NavLink
                to="/signup"
                className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-300 transition-colors duration-200"
              >
                {t('signup.title')}
              </NavLink>
            </div>
          )}
        </div>
        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-md md:hidden z-40">
            <ul className="flex flex-col px-6 py-4 text-sm font-medium space-y-4">
              {navItems.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => {
                      toggleMenu();
                      window.scrollTo(0, 0);
                    }}
                    className={({ isActive }) =>
                      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
              <li>
                <select
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 bg-white border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  defaultValue={i18n.language}
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                  <option value="ar">Arabic</option>
                  <option value="zh">Chinese</option>
                  <option value="es">Spanish</option>
                  <option value="nl">Dutch</option>
                  <option value="ja">Japanese</option>
                  <option value="pl">Polish</option>
                  <option value="fr">French</option>
                </select>
              </li>
              {user ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 w-full text-left"
                  >
                    {t('signout.title')}
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <NavLink
                      to="/signin"
                      onClick={toggleMenu}
                      className="text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
                    >
                      {t('signin.title')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/signup"
                      onClick={toggleMenu}
                      className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-300 transition-colors duration-200 w-full text-left"
                    >
                      {t('signup.title')}
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;