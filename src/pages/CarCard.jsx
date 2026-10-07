import React, { useEffect, useState } from "react";
import { LuHeart, LuTag, LuGavel } from "react-icons/lu";
import { FaHeart } from "react-icons/fa";
import CarDetailModal from "./CarDetailModal.jsx";
import { isCarLiked, toggleCarLike } from "./Likes";
import PriceTag from "../comps/PriceTag";

const CarCard = ({ car: shoe }) => {
  const shoeTitle =
    shoe?.name ||
    shoe?.cardTitle ||
    `${shoe?.brand || ""} ${shoe?.model || ""}`.trim() ||
    "Oyoq kiyim";

  const isAuction = shoe?.type === "auction";
  const isSale = shoe?.isSale === "sale";

  // Narx (Auksion uchun startPrice, market uchun price)
  const shoePrice = Number(
    shoe?.price || shoe?.startPrice || shoe?.startingPrice || 0
  );
  const shoePriceUzs = Number(shoe?.priceUzs || shoe?.startPriceUzs || 0);

  const [isLiked, setIsLiked] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const docId = shoe?.id || shoe?.shoeId || shoe?.watchId || shoe?.messageId;

  useEffect(() => {
    if (docId) setIsLiked(isCarLiked(docId));
  }, [docId]);

  const handleToggleLike = (e) => {
    e.stopPropagation();

    if (docId) {
      const newState = toggleCarLike(docId);
      setIsLiked(newState);
    }
  };

  // HAQIQIY RASMNI TOPISH (Instagram/Social linklarni tashlab yuborish)
  const getValidImage = () => {
    const allImages = [];

    if (Array.isArray(shoe?.images)) {
      allImages.push(...shoe.images);
    }
    if (shoe?.image) {
      allImages.unshift(shoe.image);
    }

    const cleanImage = allImages.find(
      (img) =>
        typeof img === "string" &&
        !img.includes("instagram.com") &&
        !img.includes("youtube.com") &&
        !img.includes("youtu.be") &&
        (img.startsWith("http://") || img.startsWith("https://"))
    );

    return cleanImage || "";
  };

  const imageUrl = getValidImage();

  // RAZMERLARNI HAR XIL FORMATLARDAN XAVFSIZ AJRATIB OLISH
  const getParsedSizes = () => {
    const raw = shoe?.sizes || shoe?.size || shoe?.sizesList || "";
    if (Array.isArray(raw)) {
      return raw.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof raw === "string" || typeof raw === "number") {
      return String(raw)
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const sizeList = getParsedSizes();

  // 1. Agar ma'lumot bo'lmasa yoki sarlavha va narx bo'lmasa kartochka chiqmaydi
  if (!shoe || (!shoeTitle && shoePrice === 0)) return null;

  // 2. Status tekshiruvi: Faqat "no-active" deb yozilgan bo'lsagina yashiriladi
  const currentStatus = String(shoe?.status || "")
    .toLowerCase()
    .trim();

  if (currentStatus === "no-active") {
    return null;
  }

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-[#0f192b] rounded-2xl overflow-hidden border-[2px] border-[#657591] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer h-full"
      >
        {/* RASM BO'LIMI */}
        <div className="relative w-full h-44 bg-slate-900 overflow-hidden shrink-0">
          {/* Skeleton Loader */}
          {!imageLoaded && imageUrl && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
              <span className="text-[10px] text-slate-500">Yuklanmoqda...</span>
            </div>
          )}

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={shoeTitle}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                setImageLoaded(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              Rasm yo'q
            </div>
          )}

          {/* BADGELAR (Brend, Sale va Auksion) */}
          <div className="absolute flex-col top-2.5 left-2.5 flex items-start gap-1 z-10">
            {shoe?.brand && (
              <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-semibold px-2 py-0.5 rounded-md border border-white/10 uppercase">
                {shoe.brand}
              </span>
            )}

            {isAuction && (
              <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md tracking-wider flex items-center gap-0.5">
                <LuGavel className="text-[10px]" /> Auksion
              </span>
            )}

            {!isAuction && isSale && (
              <span className="bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md tracking-wider flex items-center gap-0.5">
                <LuTag className="text-[10px]" /> Sale
              </span>
            )}
          </div>

          {/* LIKE TUGMASI */}
          <button
            type="button"
            onClick={handleToggleLike}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-700 hover:bg-white active:scale-90 transition-all shadow-sm z-10"
          >
            {isLiked ? (
              <FaHeart className="text-rose-500 text-base" />
            ) : (
              <LuHeart className="text-base text-slate-700" />
            )}
          </button>
        </div>

        {/* MA'LUMOT BO'LIMI */}
        <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
          <div>
            <h3 className="font-bold text-[13px] text-white leading-snug line-clamp-1 mb-1">
              {shoeTitle}
            </h3>

            {/* Price section (NARX) */}
            <div className="flex items-baseline flex-wrap gap-1 mb-1">
              <PriceTag usd={shoePrice} size="sm" />
              {shoePriceUzs > 0 && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {shoePriceUzs.toLocaleString()} UZS
                </span>
              )}
            </div>

            {/* NARXNING PASTIDA RAZMERLAR */}
            {sizeList.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
                  <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0 mr-0.5">
                    Razmer:
                  </span>
                  {sizeList.map((sz, idx) => (
                    <span
                      key={idx}
                      className="shrink-0 px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 text-amber-400 text-[10px] rounded font-semibold"
                    >
                      {sz}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specs: Color & Material */}
            {(shoe?.color || shoe?.material) && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-1.5">
                {shoe?.color && <span>{shoe.color}</span>}
                {shoe?.color && shoe?.material && <span>•</span>}
                {shoe?.material && <span>{shoe.material}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetail && (
        <CarDetailModal car={shoe} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
};

export default CarCard;
