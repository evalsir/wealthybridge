import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const testimonials = [
  // 🇰🇪 Kenya (3)
  {
    name: "Brian Mwangi",
    title: "Entrepreneur, Kenya",
    quote:
      "WealthyBridge has helped me scale my side hustle into a reliable stream of income. I trust the process completely.",
    image: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    name: "Faith Wanjiku",
    title: "Bank Teller, Nairobi",
    quote:
      "I no longer worry about where to invest — WealthyBridge has proven secure and very profitable.",
    image: "https://randomuser.me/api/portraits/women/20.jpg",
  },
  {
    name: "Kevin Otieno",
    title: "Software Engineer, Kenya",
    quote:
      "Investing has never been this easy. The fixed returns are predictable and great for budgeting.",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
  },

  // 🇹🇿 Tanzania (2)
  {
    name: "Asha Juma",
    title: "Freelancer, Dar es Salaam",
    quote:
      "I love how simple and transparent the WealthyBridge system is. Everything works as expected.",
    image: "https://randomuser.me/api/portraits/women/36.jpg",
  },
  {
    name: "Michael Mwakalinga",
    title: "Businessman, Arusha",
    quote:
      "This platform has boosted my confidence in online investing. I appreciate the clarity and support.",
    image: "https://randomuser.me/api/portraits/men/33.jpg",
  },

  // 🇺🇬 Uganda (1)
  {
    name: "Susan Nakato",
    title: "Marketing Consultant, Uganda",
    quote:
      "WealthyBridge is reliable. I was able to invest, track, and withdraw profit without any hustle.",
    image: "https://randomuser.me/api/portraits/women/59.jpg",
  },

  // 🇪🇺 Europe (4)
  {
    name: "Luca Moretti",
    title: "Investor, Italy",
    quote:
      "What a brilliant experience. I love how steady the growth is. I’m reinvesting confidently every month.",
    image: "https://randomuser.me/api/portraits/men/70.jpg",
  },
  {
    name: "Anna Schmidt",
    title: "Teacher, Germany",
    quote:
      "I was introduced to WealthyBridge by a friend, and now I’m recommending it to everyone I know.",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Thomas Jensen",
    title: "Engineer, Denmark",
    quote:
      "One of the most stress-free platforms I’ve ever used. I get my profits like clockwork.",
    image: "https://randomuser.me/api/portraits/men/88.jpg",
  },
  {
    name: "Elena Petrova",
    title: "Accountant, Bulgaria",
    quote:
      "Very secure and intuitive. WealthyBridge feels like the future of digital investing.",
    image: "https://randomuser.me/api/portraits/women/34.jpg",
  },

  // 🇨🇳 China (1)
  {
    name: "Li Wei",
    title: "Data Analyst, China",
    quote:
      "The return structure is very clear and realistic. I appreciate the integrity of the system.",
    image: "https://randomuser.me/api/portraits/men/51.jpg",
  },
];


const Testimonials = () => {
  return (
    <section className="bg-gray-100 py-20 md:py-10 px-6" id="testimonials">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold  text-blue-800 mb-4">
          Hear From Our Happy Investors
        </h2>
        <p className="text-gray-600 mb-12 max-w-xl mx-auto">
          Real feedback from people who’ve trusted WealthyBridge to build their financial future.
        </p>

        {/* Swiper Carousel */}
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
        >
          {testimonials.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="bg-white rounded-lg shadow-md p-6 m-4 text-left hover:shadow-lg transition h-full flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-full object-cover border"
                  />
                  <div>
                    <h4 className="font-semibold text-blue-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.title}</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">“{item.quote}”</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
    </section>
  );
};

export default Testimonials;
