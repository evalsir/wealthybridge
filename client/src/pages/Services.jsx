import React from "react";
import bannerImage from "../assets/services-hero.jpg"; 

const services = [
  {
    title: "Fixed-Return Investment Plans",
    description:
      "Choose from our Basic, Premium, or Super plans designed to deliver consistent and secure returns, regardless of your investment experience.",
  },
  {
    title: "Wealth Advisory & Planning",
    description:
      "Get expert insights and personalized advice to align your financial goals with long-term growth strategies.",
  },
  {
    title: "Bonus & Loyalty Programs",
    description:
      "Stay rewarded! Earn bonuses for long-term commitments and referrals through our investor loyalty program.",
  },
  {
    title: "24/7 Customer Support",
    description:
      "We provide round-the-clock assistance through chat, email, and phone to ensure smooth investing at every stage.",
  },
  {
    title: "Transparent Portfolio Tracking",
    description:
      "Easily monitor your investments with real-time updates, accessible dashboards, and detailed performance reports.",
  },
  {
    title: "Secure Transactions",
    description:
      "Your funds and personal information are protected with bank-grade encryption and compliant storage practices.",
  },
];

const Services = () => {
  return (
    <>
      {/* Hero Banner Section */}
      <section
        className="relative h-screen min-h-[400px] w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 flex items-center justify-center h-full text-white px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-snug max-w-3xl">
            Our Services & Features
          </h1>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="bg-white pt-20 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-blue-900 mb-4 text-center">
            What We Offer
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            At WealthyBridge, we’re committed to providing innovative, reliable,
            and transparent financial services that support your journey to
            wealth creation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-lg p-6 shadow hover:shadow-md transition duration-300"
              >
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-700">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
