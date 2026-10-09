import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { FiChevronLeft } from "react-icons/fi";
import CarCard from "./CarCard";
import useCars from "./UseCars"; // Hookni to'g'ridan-to'g'ri chaqiramiz
import BottomNav from "./BottomNav";
import { NavLink } from "react-router-dom";

const SalePage = ({ onBack }) => {
  // Bazadan barcha ma'lumotlarni va usedCars'ni to'g'ridan-to'g'ri olamiz
  const { usedCars, cars, loading } = useCars();

  // Orqa fon scroll bo'lishini qat'iy to'sib qo'yish
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination (15 tadan yuklab borish uchun)
  const [visibleCount, setVisibleCount] = useState(15);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);

  // Filtrlar o'zgarganda pagination'ni 15 taga reset qilish
  useEffect(() => {
    setVisibleCount(15);
  }, [selectedBrand, selectedSize, minPrice, maxPrice]);

  // Sale mahsulotlarni aniq va kafolatlangan holda yig'ish
  const saleCars = useMemo(() => {
    // Agar usedCars bo'lsa shuni olamiz, bo'lmasa cars'dan isSale === "sale" bo'lganlarni filter qilamiz
    const sourceList =
      Array.isArray(usedCars) && usedCars.length > 0 ? usedCars : cars;
    const safeCars = Array.isArray(sourceList) ? sourceList : [];

    return safeCars.filter((item) => {
      if (!item) return false;
      const isSaleVal = String(item.isSale || "").toLowerCase();
      return isSaleVal === "sale" || isSaleVal === "true" || item.sale === true;
    });
  }, [usedCars, cars]);

  // Brendlar ro'yxatini dinamik shakllantirish
  const availableBrands = useMemo(() => {
    const brandsSet = new Set();
    saleCars.forEach((item) => {
      if (item?.brand && String(item.brand).trim() !== "") {
        brandsSet.add(String(item.brand).trim());
      }
    });
    return ["All", ...Array.from(brandsSet)];
  }, [saleCars]);

  // Razmerlar ro'yxatini dinamik shakllantirish
  const availableSizes = useMemo(() => {
    const sizesSet = new Set();
    saleCars.forEach((item) => {
      const raw = item?.sizes || item?.size || item?.sizesList || "";
      let list = [];
      if (Array.isArray(raw)) {
        list = raw.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof raw === "string" || typeof raw === "number") {
        list = String(raw)
          .split(/[,;\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      list.forEach((sz) => {
        if (sz) sizesSet.add(sz);
      });
    });

    return [
      "All",
      ...Array.from(sizesSet).sort((a, b) =>
        !isNaN(a) && !isNaN(b) ? Number(a) - Number(b) : a.localeCompare(b)
      ),
    ];
  }, [saleCars]);

  // Filtrlash mantiqi (Brend, Razmer va Narx)
  const filteredSaleCars = saleCars.filter((car) => {
    if (!car) return false;

    // Brend bo'yicha
    if (selectedBrand !== "All") {
      const carBrand = String(car?.brand || "").toLowerCase();
      if (carBrand !== selectedBrand.toLowerCase()) return false;
    }

    // Razmer bo'yicha
    if (selectedSize !== "All") {
      const raw = car?.sizes || car?.size || car?.sizesList || "";
      let carSizes = [];
      if (Array.isArray(raw)) {
        carSizes = raw.map((s) => String(s).trim());
      } else if (typeof raw === "string" || typeof raw === "number") {
        carSizes = String(raw)
          .split(/[,;\s]+/)
          .map((s) => s.trim());
      }
      if (!carSizes.includes(String(selectedSize))) return false;
    }

    // Narx bo'yicha
    const carPrice = Number(
      car?.price || car?.startPrice || car?.startingPrice || 0
    );
    if (minPrice && carPrice < Number(minPrice)) return false;
    if (maxPrice && carPrice > Number(maxPrice)) return false;

    return true;
  });

  // Infinite Scroll IntersectionObserver
  const lastElementRef = useCallback(
    (node) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          visibleCount < filteredSaleCars.length
        ) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 15);
            setIsLoadingMore(false);
          }, 200);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, visibleCount, filteredSaleCars.length]
  );

  const handleResetFilters = () => {
    setSelectedBrand("All");
    setSelectedSize("All");
    setMinPrice("");
    setMaxPrice("");
    setVisibleCount(15);
  };

  const visibleCars = filteredSaleCars.slice(0, visibleCount);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#112544] flex flex-col w-full h-full overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-[#0f192b] shrink-0 shadow-sm">
        <NavLink to="/">
          <button
            type="button"
            className="flex items-center gap-1 text-white text-sm font-bold bg-[#162238] border border-slate-700/60 px-3 py-1.5 rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            <FiChevronLeft size={18} />
            <span>Orqaga</span>
          </button>
        </NavLink>
        <h2 className="text-base font-extrabold text-white">
          Sale Mahsulotlar
        </h2>
        <div className="w-16" />
      </div>

      {/* ASOSIY CONTENT SCROLL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 [touch-action:pan-y]">
        <div>
          <h1 className="text-xl font-black text-white mb-1">
            Maxsus Chegirmalar
          </h1>
          <p className="text-xs text-slate-400">
            Aksiya doirasidagi barcha sale mahsulotlar
          </p>
        </div>

        {/* FILTRLAR PANELI */}
        <div className="bg-[#0f192b] p-3.5 rounded-2xl border border-slate-700/80 space-y-3 shadow-sm">
          {/* Brend bo'yicha */}
          <div>
            <label className="block text-[11px] font-bold text-white uppercase tracking-wider mb-1.5">
              Brend bo'yicha
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
              {availableBrands.map((brand) => (
                <button
                  key={`sale-brand-${brand}`}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedBrand === brand
                      ? "bg-amber-400 text-black shadow-md"
                      : "bg-[#162238] text-white border border-slate-600/60 hover:bg-[#1f2d4a]"
                  }`}
                >
                  {brand === "All" ? "Barchasi" : brand}
                </button>
              ))}
            </div>
          </div>

          {/* Razmer bo'yicha */}
          <div>
            <label className="block text-[11px] font-bold text-white uppercase tracking-wider mb-1.5">
              Razmer bo'yicha
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
              {availableSizes.map((size) => (
                <button
                  key={`sale-size-${size}`}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedSize === size
                      ? "bg-amber-400 text-black shadow-md"
                      : "bg-[#162238] text-white border border-slate-600/60 hover:bg-[#1f2d4a]"
                  }`}
                >
                  {size === "All" ? "Barchasi" : size}
                </button>
              ))}
            </div>
          </div>

          {/* Narx bo'yicha */}
          <div>
            <label className="block text-[11px] font-bold text-white uppercase tracking-wider mb-1.5">
              Narxi ($)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Dan ($)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="number"
                placeholder="Gacha ($)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Filtrni tozalash */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              type="button"
              className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
            >
              Filtrni tozalash
            </button>
          </div>
        </div>

        {/* NATIJALAR */}
        <div>
          <p className="text-xs text-slate-300 mb-2">
            Topilgan sale mahsulotlar:{" "}
            <span className="font-bold text-white">
              {filteredSaleCars.length} ta
            </span>
          </p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-64 bg-[#0f192b] animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : filteredSaleCars.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-6">
                {visibleCars.map((car, index) => {
                  const isLast = index === visibleCars.length - 1;
                  return (
                    <div
                      key={car.id || car.shoeId || index}
                      ref={isLast ? lastElementRef : null}
                    >
                      <CarCard car={car} />
                    </div>
                  );
                })}
              </div>

              {/* LOADING SPINNER */}
              {(isLoadingMore || visibleCount < filteredSaleCars.length) && (
                <div className="flex justify-center items-center py-4">
                  <div className="flex items-center gap-2 bg-[#0f192b] border border-slate-700 px-4 py-2 rounded-full shadow-lg">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-300 font-medium">
                      Yana yuklanmoqda...
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm bg-[#0f192b] rounded-2xl border border-slate-700/60 mt-4">
              Sale mahsulot topilmadi.
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default SalePage;
