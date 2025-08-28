import React, { useState } from "react";
import faqBg from "../assets/faq-bg.jpg"; // Replace with your image path

const faqs = [
  {
    question: "What is WealthyBridge?",
    answer:
      "WealthyBridge is a secure investment platform offering fixed-percentage returns on plans tailored for every type of investor.",
  },
  {
    question: "How safe is my investment?",
    answer:
      "We use strict risk management strategies and operate transparently to protect and grow your investment.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply sign up, choose a plan, make your deposit, and track your earnings in real-time through your dashboard.",
  },
  {
    question: "Can I withdraw anytime?",
    answer:
      "Withdrawals depend on the investment plan. Each plan has defined withdrawal terms, which are clearly outlined before investing.",
  },
  {
    question: "Do you offer any bonuses?",
    answer:
      "Yes! We offer loyalty and long-term bonuses for users who stay invested over specific durations.",
  },
  {
    question: "What currencies do you support?",
    answer:
      "We support multiple currencies and provide a real-time currency converter to help you make informed decisions.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="text-gray-100">
      {/* Top Hero Section */}
      <div className="relative h-[500px] w-full">
        <img
          src={faqBg}
          alt="FAQ background"
          className="absolute inset-0 w-full h-full object-cover z-[-1]"
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">FAQs</h1>
          <p className="text-lg">See all the FAQs below</p>
        </div>
      </div>

      {/* FAQ Content */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-blue-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left px-6 py-4 text-blue-800 font-medium hover:bg-gray-50 transition"
              >
                <span>{item.question}</span>
                <span className="text-xl">
                  {openIndex === index ? "–" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-sm text-gray-700 transition-all duration-300">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FAQ;
