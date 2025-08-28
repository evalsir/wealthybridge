import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Hero = () => {
  const [planType, setPlanType] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [priceValue, setPriceValue] = React.useState(1000);
  const [error, setError] = React.useState("");
  const [showError, setShowError] = React.useState(false);

  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  React.useEffect(() => {
    setStartDate(today); 
  }, []);

  const displayError = (message) => {
    setError(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  const handleSearch = () => {
    if (!planType) return displayError("Please select a plan type.");
    if (!startDate) return displayError("Please select a start date.");
    if (!priceValue || priceValue < 50)
      return displayError(
        "Please set your desired share investment (minimum $50)."
      );

    navigate("/plans", {
      state: { planType, startDate, priceValue },
    });
  };

  return (
    <section className="bg-hero-pattern bg-cover bg-center bg-no-repeat min-h-[90vh] w-full relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* ✅ Animated Error Popup using Framer Motion */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 1 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-400 text-white px-3 py-2 rounded-md shadow-md z-50"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative pb-30 z-10 flex flex-col justify-center items-center min-h-screen px-4 pt-32 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-lg sm:text-xl uppercase tracking-widest text-blue-400">
            Our Investment Plans
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            Discover the Right Plan for Your Future
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Our packages are designed to help you achieve your financial goals
            with ease and confidence. Whether you're looking for retirement
            savings, growth opportunities, or a secure investment, we have the
            perfect plan for you.
          </p>
        </div>

        {/* Search Form */}
        <div className="w-full max-w-6xl bg-gray-300 backdrop-blur-md rounded-2xl shadow-lg mt-10 p-6 space-y-6 text-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Plan Type */}
            <div>
              <label
                htmlFor="plan"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Plan Type
              </label>
              <select
                name="plan"
                id="plan"
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-gray-100 outline-none"
              >
                <option value="">Select a plan</option>
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
                <option value="Super">Super</option>
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label
                htmlFor="startDate"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-gray-100 outline-none"
                min={new Date().toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Range Selector */}
            <div>
              <label
                htmlFor="investment"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Pick Shares:{" "}
                <span className="font-bold text-blue-600">{priceValue}</span>
              </label>
              <input
                type="range"
                min="50"
                max="10000"
                step={50}
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSearch}
              className="bg-blue-950 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200"
            >
              Search Plans
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
