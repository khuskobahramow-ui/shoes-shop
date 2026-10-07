import React, { useState, useEffect } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const BannerSlider = () => {
  // 5 ta rasm URL'ini shu yerga o'zingizning havolalaringiz bilan almashtirasiz
  const slides = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop", // 1-rasm
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop", // 2-rasm
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1000&auto=format&fit=crop", // 3-rasm
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1000&auto=format&fit=crop", // 4-rasm
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1000&auto=format&fit=crop", // 5-rasm
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Har 10 soniyada avtomatik o'tishi (10000ms = 10 soniya)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  return (
    <div className="relative w-[95%] m-auto h-50 sm:h-50 rounded-2xl overflow-hidden border-[2px] border-[#657591] bg-[#0f192b] mt-[13px]  group shadow-md">
      {/* Rasmlar karuseli */}
      <div
        className=" h-full m-auto flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Banner ${index + 1}`}
            className="w-full h-full object-cover shrink-0"
          />
        ))}
      </div>

      {/* Chapga o'tkazish tugmasi (ustiga kelganda chiqadi) */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
      >
        <LuChevronLeft size={16} />
      </button>

      {/* O'ngga o'tkazish tugmasi */}
      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
      >
        <LuChevronRight size={16} />
      </button>

      {/* Pastdagi nuqtalar (Dots) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === index ? "w-5 bg-amber-400" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
