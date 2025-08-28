import React from "react";
import wb1 from "../assets/video/wb1.mp4";
import Hero from "../components/Hero/Hero";
import HowItWorks from "../components/How/HowItWorks";
import AboutUs from "./About";
import Testimonials from "../components/Testimonials/Testimonials";
import LiveTicker from "../components/CurrencyTickerLive/CurrencyTickerLive";
import WhoWeAre from "../components/WhoWeAre/WhoWeAre";

const Home = () => {
  return (
    <div>
      <div className="relative min-h-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute right-0 top-0 h-full w-full object-cover z-[-1]"
        >
          <source src={wb1} type="video/mp4" />
        </video>
        <Hero />
      </div>
      <HowItWorks />
      <WhoWeAre />
      <Testimonials />
      <LiveTicker />
    </div>
  );
};

export default Home;
