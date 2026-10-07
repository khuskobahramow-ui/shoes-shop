import React from "react";
import { NavLink } from "react-router-dom";
import { LuGavel, LuTag } from "react-icons/lu";

const MenuBar = () => {
  return (
    <div className="w-full px-4 py-3">
      {/* Mobil va kompyuter uchun 2 ta teng karta */}
      <div className="grid grid-cols-2 gap-3">
        {/* Auksion */}
        <NavLink
          to="/auction"
          className="flex flex-col items-center justify-center p-3 bg-[#0f192b] rounded-2xl border border-slate-700 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5 bg-rose-500/10 group-hover:scale-110 transition-transform duration-200">
            <LuGavel className="text-2xl text-rose-500" />
          </div>
          <span className="text-sm font-semibold leading-3 text-white text-center">
            Auksion
          </span>
        </NavLink>

        {/* Sale (Chegirma / Skidka) */}
        <NavLink
          to="/sale"
          className="flex flex-col items-center justify-center p-3 bg-[#0f192b] rounded-2xl border border-slate-700 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5 bg-amber-500/10 group-hover:scale-110 transition-transform duration-200">
            <LuTag className="text-2xl text-amber-400" />
          </div>
          <span className="text-sm font-semibold leading-3 text-white text-center">
            Sale
          </span>
        </NavLink>
      </div>
    </div>
  );
};

export default MenuBar;
