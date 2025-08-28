//src/components/currencytickerlive/currencytickerlive.jsx
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/free-mode";

const CurrencyTickerLive = () => {
  const [rates, setRates] = useState([]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await response.json();

        if (!data || !data.rates || data.result !== "success") {
          throw new Error("Invalid API response");
        }

        const allRates = data.rates;
        const required = [
          "USD",
          "EUR",
          "TZS",
          "UGX",
          "CNY",
          "GBP",
          "ZAR",
          "INR",
          "AED",
          "JPY",
        ];

        const formatted = required
          .filter((symbol) => allRates[symbol])
          .map((symbol) => ({
            pair: `${symbol}/KES`,
            rate: (1 / allRates[symbol]).toFixed(4),
          }));

        setRates(formatted);
      } catch (error) {
        console.error("Failed to fetch FX data:", error.message);
        setRates([]);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white py-2 relative flex justify-center">
      <div className="w-[80%]">
        <Swiper
          modules={[Autoplay, FreeMode]}
          slidesPerView="auto"
          spaceBetween={30}
          freeMode={true}
          loop={true}
          speed={4000} // Controls scroll speed — higher is slower
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
          }}
          allowTouchMove={false} // Prevent drag interaction
          className="!flex"
        >
          {rates.map((item, index) => (
            <SwiperSlide
              key={index}
              className="!w-auto px-4 text-sm text-gray-800 border-r border-gray-300 flex items-center"
            >
              <span className="font-semibold text-blue-600 mr-1">
                {item.pair}:
              </span>
              <span>
                Rate: <strong>{item.rate}</strong>
              </span>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <button
        className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800 transition-all"
        onClick={() => (window.location.href = "/converter")}
      >
        Currency Converter →
      </button>
    </div>
  );
};

export default CurrencyTickerLive;
