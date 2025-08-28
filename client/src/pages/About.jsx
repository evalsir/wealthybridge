import React from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/about-hero.jpg";

const About = () => {
  return (
    <div className=" text-gray-800">
      {/* Hero Section */}
      <section
        className="relative h-screen min-h-[400px] w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 z-0" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-medium uppercase tracking-widest mb-4 text-blue-200">
            About Us
          </h2>

          {/* Original Heading */}
          <h1 className="text-3xl md:text-5xl font-bold leading-snug max-w-3xl">
            We are your partner. We share your vision. Go Ahead!
          </h1>
        </div>
      </section>

      {/* About WealthyBridge */}
      <section className="py-16 bg-white px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-blue-900">
          About WealthyBridge
        </h2>
        <p className="text-lg leading-relaxed text-gray-700">
          WealthyBridge is a progressive investment platform headquartered in
          Nairobi, Kenya. We specialize in secure, high-yield investment options
          tailored to meet the needs of both individuals and businesses.
          Licensed to operate under regulated investment guidelines,
          WealthyBridge is committed to transparency and inclusivity, empowering
          people to grow their financial portfolios. Much like the agency model
          in traditional banking, we ensure accessibility through simplified
          digital onboarding and customer support.
        </p>
      </section>

      {/* Our Values */}
      <section className="bg-blue-100 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-blue-900">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Closer",
                points: [
                  "In touch with our customers.",
                  "Looking out for our colleagues.",
                  "Proactive, enhancing their lives.",
                ],
                desc: "To be Closer is to get to know the people you work with and the customers you serve beyond being just a colleague or a customer. It’s about valuing the human being.",
              },
              {
                title: "Connected",
                points: [
                  "In touch with our customers.",
                  "Looking out for our colleagues.",
                  "Proactive, enhancing their lives.",
                ],
                desc: "To be Connected is to realize we are all part of one team, with one purpose. It’s about breaking down silos and gaining inspiration from best-practices.",
              },
              {
                title: "Courageous",
                points: [
                  "Going beyond the status quo.",
                  "Acting with purpose and direction.",
                  "The head and the heart guide us.",
                ],
                desc: "To be Courageous is to challenge the way things are done today in a constructive way and share ideas to make things better.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded shadow hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm mb-3">{item.desc}</p>
                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                  {item.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Behaviours */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-blue-900">
            Our Behaviours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Closer
              </h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                <li>Get to know your customers and colleagues personally.</li>
                <li>
                  Anticipate customers’ needs and be proactive in providing
                  support.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Connected
              </h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                <li>Act as one team; one WealthyBridge family.</li>
                <li>
                  Get inspired by innovations and apply them to our services.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Courageous
              </h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                <li>Challenge the status quo constructively.</li>
                <li>Share bold ideas to improve.</li>
                <li>Act with passion and purpose.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our History */}
      <section className="bg-gray-100 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">Our History</h2>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            We are proud of our history and heritage which is rooted in
            empowering everyday investors to achieve more. Since our founding,
            WealthyBridge has grown from a concept to a thriving digital
            investment platform serving thousands. Take a look at how far we’ve
            come since our launch. Start scrolling to explore.
          </p>
          <Link
            to="/history"
            className="inline-block bg-blue-950 text-white px-6 py-2 rounded-full hover:bg-blue-900 transition"
          >
            Read More
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
