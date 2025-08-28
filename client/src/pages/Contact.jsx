import React from "react";
import contactBg from "../assets/contact-bg.jpg"; // Replace with your image path
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import { MdEmail } from "react-icons/md";

const Contact = () => {
  return (
    <div className="text-gray-800">
      {/* Hero Section with Background Image */}
      <div className="relative h-[500px] w-full">
        <img
          src={contactBg}
          alt="Contact Background"
          className="absolute inset-0 w-full h-full object-cover z-[-1]"
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-lg">Let’s talk — we’d love to hear from you</p>
        </div>
      </div>

      {/* Contact Form Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <div className="bg-blue-50 rounded-lg shadow p-6 md:p-10">
          <h2 className="text-2xl font-semibold text-blue-900 mb-6">
            Send Us a Message
          </h2>
          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="Your Name"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="johndoe@gmail.com"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                rows="5"
                placeholder="Type your message here..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="bg-blue-900 cursor-pointer text-white px-6 py-2 rounded-md hover:bg-blue-800 transition"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col justify-between text-sm text-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Head Office
            </h3>
            <p>WealthyBridge Investments</p>
            <p>Nairobi, Kenya</p>
            <p>GPO, 19001-001</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Contact Info
            </h3>
            <p>Email: info@wealthybridge.com</p>
            <p>Phone: +254 700 123 456</p>
            <p>Hours: Mon - Fri, 9:00AM - 5:00PM</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Follow Us
            </h3>
            <div className="flex gap-5 mt-2 text-blue-800 text-xl">
              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="mailto:info@wealthybridge.com"
                className="hover:text-red-600"
                aria-label="Email"
              >
                <MdEmail />
              </a>
              <a
                href="https://twitter.com/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-500"
                aria-label="Twitter / X"
              >
                <FaTwitter />
              </a>
              <a
                href="https://wa.me/254700123456"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-500"
                aria-label="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href="https://tiktok.com/@yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black"
                aria-label="TikTok"
              >
                <SiTiktok />
              </a>
              <a
                href="https://instagram.com/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-600"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
