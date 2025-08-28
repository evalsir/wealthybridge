import React from "react";

const steps = [
  {
    title: "Register Your Account",
    icon: "📝",
    description:
      "Sign up with your email or phone number in under a minute. It’s fast, secure, and free to get started.",
  },
  {
    title: "Verify Identity (KYC)",
    icon: "🛡️",
    description:
      "Complete identity verification to unlock full access and keep your investments safe.",
  },
  {
    title: "Fund Your Wallet",
    icon: "💳",
    description:
      "Deposit funds via PayPal,Stripe,Skrill,MPESA,Flutterwave,MTN or mastercard depending on your location.",
  },
  {
    title: "Choose a Plan",
    icon: "📈",
    description:
      "Pick from Basic, Premium, or Super plans. Each plan has fixed profit percentages with zero guesswork.",
  },
  {
    title: "Track Real-Time Growth",
    icon: "📊",
    description:
      "Monitor your investment progress with our real-time calculator. No surprises — just results.",
  },
  {
    title: "Withdraw After Maturity",
    icon: "💰",
    description:
      "Withdraw your profits once your plan matures. Early withdrawals incur a 30% penalty.",
  },
];

export default function HowItWorks() {
  return (
    <section className="pt-18 pb-10 py-18 md:py-20 bg-white" id="how-it-works">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="border-l-8 border-blue-800 pl-4 text-3xl sm:text-4xl font-bold text-blue-800 mb-12">
          How WealthyBridge Works?
        </h2>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300"
            >
              <div className="text-4xl text-blue-700 mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
