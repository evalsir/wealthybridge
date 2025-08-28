import React from "react";
import legalBg from "../assets/legal-bg.jpg"; // replace with your image

const Legal = () => {
  return (
    <div className="text-gray-800">
      {/* Hero Section */}
      <div className="relative h-[500px] w-full">
        <img
          src={legalBg}
          alt="Legal Background"
          className="absolute inset-0 w-full h-full object-cover z-[-1]"
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Legal & Investment Guide</h1>
          <p className="text-lg max-w-2xl">
            Understand your rights, responsibilities, and the opportunities that
            come with investing on WealthyBridge.
          </p>
        </div>
      </div>

      {/* Legal Content */}
      <section className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Why WealthyBridge
          </h2>
          <p className="text-gray-700">
            WealthyBridge offers fixed-percentage earnings on a variety of
            investment plans. These plans provide guaranteed profits for
            committed durations. Returns are clearly defined, helping you plan
            your finances with confidence. Examples include:
          </p>
          <ul className="list-disc list-inside mt-3 text-gray-600 space-y-2">
            <li>
              <strong>Basic 1 Month:</strong> 13% profit. $6.5 - $650 returns.
            </li>
            <li>
              <strong>Basic 2 Months:</strong> 22% profit. $22 - $2,200 returns.
            </li>
            <li>
              <strong>Premium 3 Months:</strong> 27% profit. $81 - $4,050
              returns.
            </li>
            <li>
              <strong>Premium 6 Months:</strong> 33% profit. $165 - $8,250
              returns.
            </li>
            <li>
              <strong>Super 9 Months:</strong> 39% profit. $585 - $19,500
              returns.
            </li>
            <li>
              <strong>Super 12 Months:</strong> 45% profit. $1,125 - $45,000
              returns.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Simple & User-Friendly
          </h2>
          <p className="text-gray-700">
            WealthyBridge doesn’t require prior investment knowledge. With just
            a few clicks, you can choose your plan and let your money grow while
            you focus on life. Your profits are calculated mathematically — no
            stress, no guesswork.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Who Can Invest?
          </h2>
          <p className="text-gray-700">
            Anyone looking to grow their wealth can invest with us. Whether
            you're a professional with limited time or a business owner seeking
            extra income, WealthyBridge is here for you.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Time-Saving & Stress-Free
          </h2>
          <p className="text-gray-700">
            Busy with work or life? No problem. WealthyBridge offers investment
            plans that grow passively, freeing your time and relieving financial
            pressure. No bookkeeping required.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Entrepreneurs & Side Hustles
          </h2>
          <p className="text-gray-700">
            Business underperforming? Use WealthyBridge as your financial
            backup. Invest safely and generate extra income on the side with our
            high-yield plans.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Before You Invest
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              Explore all available investment plans and understand their
              limits.
            </li>
            <li>
              Start small if you're uncertain, but note that higher investments
              yield higher returns.
            </li>
            <li>
              Long-term plans (Premium 6M, Super 9M, Super 12M) come with bonus
              rewards.
            </li>
            <li>
              Canceling an investment attracts a 30% fee due to operational
              disruption.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Account Safety
          </h2>
          <p className="text-gray-700">
            Your account security is your responsibility. Never share login
            details. Contact our support team if you wish to deactivate or
            delete your account.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Frequently Asked Questions
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>How do I start investing?</strong> Register, login, choose
              a plan, and invest.
            </li>
            <li>
              <strong>Is my investment safe?</strong> Yes. We guarantee
              fixed-percentage returns, shielding you from market volatility.
            </li>
            <li>
              <strong>What if I miss my withdrawal date?</strong>{" "}
              Auto-reinvestment occurs 24 hours after maturity.
            </li>
            <li>
              <strong>Can I earn bonuses?</strong> Yes, on select long-term
              plans. Basic plans do not qualify.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            Important Warnings
          </h2>
          <ul className="list-disc list-inside text-red-600 space-y-2">
            <li>
              Always confirm paybill or wallet account numbers before sending
              funds.
            </li>
            <li>
              We are not liable for incorrect transactions caused by user error.
            </li>
            <li>Log in on the maturity day to avoid auto-reinvestment.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Terms and Conditions
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>By registering, you agree to our terms and policies.</li>
            <li>Provide accurate information when creating your account.</li>
            <li>Names used during registration MUST match those in your payment method</li>
            <li>Choose a payment method valid in your region.</li>
            <li>Your account security depends on you,store your account details safely.</li>
            <li>WealthyBridge has no brokers — you are in full control.</li>

            <li>Canceling investments incurs a 30% penalty.</li>
            <li>
              Mature investments are auto-reinvested after 24 hours if not
              withdrawn.
            </li>
            <li>
              Bonuses apply only to Premium 6M, Super 9M, and Super 12M —
              subject to board approval.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Legal;
