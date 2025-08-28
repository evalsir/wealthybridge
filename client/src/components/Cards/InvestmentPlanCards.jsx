
// src/components/InvestmentPlanCards.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from '../../context/AuthContext';
import investmentVideo from "../../assets/video/ihero.mp4";

const investmentPlans = [
  {
    id: 1,
    title: "Basic Plan (1 Month)",
    planKey: "basic_1m",
    duration: "28 Days",
    returns: "13%",
    minInvestment: 50,
    maxInvestment: 5000,
    description: "A great starter option with fixed 13% ROI over a short 28-day term.",
  },
  {
    id: 2,
    title: "Basic Plan (2 Months)",
    planKey: "basic_2m",
    duration: "56 Days",
    returns: "22%",
    minInvestment: 50,
    maxInvestment: 10000,
    description: "Boost your earnings with this 2-month plan and 22% guaranteed profit.",
  },
  {
    id: 3,
    title: "Premium Plan (3 Months)",
    planKey: "premium_3m",
    duration: "84 Days",
    returns: "27%",
    minInvestment: 300,
    maxInvestment: 15000,
    description: "Perfect for serious investors — steady returns over 3 months.",
  },
  {
    id: 4,
    title: "Premium Plan (6 Months)",
    planKey: "premium_6m",
    duration: "172 Days",
    returns: "33%",
    minInvestment: 500,
    maxInvestment: 25000,
    description: "Mid-to-long term plan with excellent ROI and bonus eligibility.",
  },
  {
    id: 5,
    title: "Super Plan (9 Months)",
    planKey: "super_9m",
    duration: "260 Days",
    returns: "39%",
    minInvestment: 1500,
    maxInvestment: 50000,
    description: "High-level investment option with strong profits and board bonuses.",
  },
  {
    id: 6,
    title: "Super Plan (12 Months)",
    planKey: "super_12m",
    duration: "348 Days",
    returns: "45%",
    minInvestment: 2500,
    maxInvestment: 100000,
    description: "Our top-tier plan — designed for maximum long-term growth and rewards.",
  },
];

// PlanCard Component
const PlanCard = ({ plan }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleInvestClick = () => {
    if (user) {
      navigate('/invest-now', { state: { plan: plan.planKey } });
    } else {
      navigate('/signin', { state: { plan: plan.planKey } }); // Changed to /signin for consistency
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-blue-800 flex flex-col">
      <h3 className="text-xl font-bold text-blue-800 mb-2">{plan.title}</h3>
      <p className="text-gray-600 mb-4">{plan.description}</p>
      <div className="text-sm text-gray-700 space-y-1 mb-4">
        <p><strong>Duration:</strong> {plan.duration}</p>
        <p><strong>Fixed Return:</strong> {plan.returns}</p>
        <p><strong>Min Investment:</strong> ${plan.minInvestment.toLocaleString()}</p>
        <p><strong>Max Investment:</strong> ${plan.maxInvestment.toLocaleString()}</p>
      </div>
      <button
        onClick={handleInvestClick}
        className="mt-auto w-full cursor-pointer bg-blue-950 text-white py-2 rounded-full hover:bg-blue-700 transition duration-200"
      >
        Invest Now
      </button>
    </div>
  );
};

// Main Component
const InvestmentPlanCards = () => {
  return (
    <>
      {/* Hero Video Banner */}
      <section className="relative h-screen min-h-[400px] w-full bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={investmentVideo}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 flex items-center justify-center h-full text-white px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-snug max-w-3xl">
            Choose a Plan That Grows Your Wealth
          </h1>
        </div>
      </section>

      {/* Investment Cards Section */}
      <section className="px-6 py-20 bg-gray-100" id="plans">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center text-blue-800 mb-12">
            Available Investment Plans
          </h2>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {investmentPlans.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default InvestmentPlanCards;