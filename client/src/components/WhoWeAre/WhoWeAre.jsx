import React from "react";
import { Link } from "react-router-dom";

const aboutHighlights = [
  {
    title: "Our Mission",
    content:
      "To empower individuals and businesses by offering fixed, secure, and high-return investment opportunities accessible to all.",
  },
  {
    title: "Our Vision",
    content:
      "To become the most trusted and transparent investment platform globally, redefining how wealth is built and sustained.",
  },
  {
    title: "Our Goals",
    content:
      "To simplify investing, ensure consistent returns, and support financial growth for every investor, regardless of their experience.",
  },
  {
    title: "Our Values",
    content:
      "Integrity, transparency, innovation, and user-first service — the pillars that guide everything we do at WealthyBridge.",
  },
];

const WhoWeAre = () => {
  return (
    <section className="py-20 bg-white px-6" id="about-us">
      <div className="max-w-7xl mx-auto mt-1">
        <h2 className="border-l-8 pl-4 border-blue-800 text-3xl sm:text-4xl mx-2 font-bold text-blue-800 mb-4">
          Who We Are
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-2">
          At WealthyBridge, we are more than just an investment platform. We are
          your long-term partner in financial success — offering predictable
          profits, powerful tools, and peace of mind.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {aboutHighlights.map((item, idx) => (
            <div
              key={idx}
              className="text-left bg-gray-50 p-6 rounded-lg shadow hover:shadow-md transition duration-300 border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-700">{item.content}</p>
            </div>
          ))}
        </div>
        {/* Learn More Button */}
        <Link
          to="/about"
          className="inline-block bg-blue-950 text-white rounded-full px-3 py-1.5 mt-4 hover:underline"
        >
          Learn More
        </Link>
      </div>
    </section>
  );
};

export default WhoWeAre;
