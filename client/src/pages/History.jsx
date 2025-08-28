import React from "react";

const History = () => {
  return (
    <section className="bg-white pt-32 pb-16 px-4 sm:px-6 md:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-blue-800 mb-8 border-l-8 pl-4 border-blue-800">
          Our History
        </h2>

        <div className="space-y-6 bg-gray-50 p-6 rounded-xl shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            WealthyBridge began its journey in{" "}
            <span className="font-semibold">2023</span> with a vision to
            redefine how people invest and grow their wealth online. The
            founders saw a gap in accessible, transparency, and trustworthy
            investment platforms — and decided to bridge it.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Starting as a small initiative focused on fixed-percentage return
            plans, WealthyBridge quickly gained traction by offering clear
            investment tiers, real-time onboarding support, and guaranteed
            bonuses for long-term investors. Our approach was simple: make
            investment stress-free and rewarding for everyone.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Over time, we've evolved into a trusted platform offering{" "}
            <span className="font-semibold">
              Basic, Premium, and Super investment plans
            </span>
            , with each tailored to fit different investor goals.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Today, WealthyBridge continues to grow — guided by our mission to
            empower people with reliable investment tools, top-tier support, and
            lasting financial impact. 
          </p>
        </div>
      </div>
    </section>
  );
};

export default History;
