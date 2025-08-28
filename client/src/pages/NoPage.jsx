import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 mt-3 text-white py-10 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo and About */}
        <div>
          <Link to="/" className="text-2xl font-bold text-white">
            WealthyBridge
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            Smart investing made simple. Grow your wealth with flexible, secure, and sustainable investment options.
          </p>
        </div>

        {/* Important Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Important Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/investment-plans">Investment Plans</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/legal">Terms & Privacy</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Resources</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/bonuses">Bonuses</Link></li>
            <li><Link to="/testimonials">Testimonials</Link></li>
            <li><Link to="/contact">Support</Link></li>
            <li><Link to="/converter">Currency Converter</Link></li>
          </ul>
        </div>

        {/* Newsletter and Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Get Updates</h3>
          <p className="text-sm text-gray-400 mb-3">Subscribe to receive the latest updates and offers.</p>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="johndoe@gmail.com"
              className="px-4 py-2 rounded-md border text-white text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-950 cursor-pointer px-4 py-2 text-sm rounded-md"
            >
              Subscribe
            </button>
          </form>
          <div className="mt-5 text-sm text-gray-300">
            <p>Email: info@wealthybridge.com</p>
            <p>Phone: +254 700 123 456</p>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} WealthyBridge. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
