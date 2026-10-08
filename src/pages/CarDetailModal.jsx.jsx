import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import {
  LuX,
  LuCalendar,
  LuShieldCheck,
  LuPalette,
  LuSettings2,
  LuChevronLeft,
  LuChevronRight,
  LuExpand,
  LuShoppingBag,
  LuSend,
  LuPhone,
  LuClock,
} from "react-icons/lu";
import { FaInstagram } from "react-icons/fa";
import { toast } from "react-toastify";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import PriceTag from "../comps/PriceTag";

const ADMIN_TELEGRAM = "https://t.me/your_admin_username";
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = import.meta.env.VITE_ADMIN_CHAT_ID || "";

const StatChip = ({ icon: Icon, label, value }) => {
  const hasValue = value && value !== "" && value !== "-";
  return (
    <div className="bg-[#0f192b] rounded-2xl p-3 flex flex-col gap-1.5 min-w-0 shadow-sm border border-slate-700/60">
      <div className="flex items-center gap-1.5 text-slate-400">
        {Icon && <Icon size={14} className="text-amber-500" />}
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-bold truncate ${
          hasValue ? "text-white" : "text-slate-500 font-medium"
        }`}
      >
        {hasValue ? value : "Kiritilmagan"}
      </span>
    </div>
  );
};

/* KATTALASHTIRILGAN GALEREYA (FULLSCREEN) */
const FullscreenGallery = ({ images, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);

  const goNext = () => setIndex((prev) => (prev + 1) % images.length);
  const goPrev = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleDragEnd = (e, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      goNext();
    } else if (info.offset.x > swipeThreshold) {
      goPrev();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999999] bg-black flex flex-col justify-between select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        className="w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 ? (
          <div className="px-3.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-white text-xs font-bold shadow-md">
            {index + 1} / {images.length}
          </div>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-slate-900/90 border border-white/30 flex items-center justify-center text-white active:scale-95 transition-transform shadow-2xl"
        >
          <LuX size={24} />
        </button>
      </div>

      <div
        className="w-full flex-1 flex items-center justify-center p-2 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          key={`fs-img-${index}`}
          src={images[index]}
          alt=""
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="max-w-full max-h-[82vh] object-contain select-none rounded-md cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl z-50"
            >
              <LuChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl z-50"
            >
              <LuChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      <div
        className="w-full pb-6 pt-2 flex justify-center gap-2 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 &&
          images.map((_, i) => (
            <div
              key={`fs-dot-${i}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
      </div>
    </motion.div>
  );
};

/* ASOSIY SHOES DETAIL MODAL */
const CarDetailModal = ({ car: product, onClose }) => {
  const images =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  const rawSizes = product?.sizes || product?.sizeList || product?.razmer || [];
  const sizeList = Array.isArray(rawSizes)
    ? [...new Set(rawSizes)]
    : typeof rawSizes === "string"
    ? [...new Set(rawSizes.split(/[\s,]+/).filter(Boolean))]
    : [];

  const [selectedSize, setSelectedSize] = useState(null);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cooldownKey = `order_cooldown_${
    product?.id || product?.shoeId || "item"
  }`;
  const [cooldownTime, setCooldownTime] = useState(() => {
    const saved = localStorage.getItem(cooldownKey);
    if (saved) {
      const diff = parseInt(saved, 10) - Date.now();
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (sizeList.length > 0 && !selectedSize) {
      setSelectedSize(sizeList[0]);
    }
  }, [sizeList]);

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const interval = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(cooldownKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTime, cooldownKey]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!product) return null;

  const instagramUrl = product.instagram || product.Instagram || "";
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id: "Noma'lum",
    first_name: "Mehmon",
    last_name: "",
    username: "yo'q",
    photo_url: "",
  };

  const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 40;
    if (info.offset.x < -swipeThreshold) {
      goNext();
    } else if (info.offset.x > swipeThreshold) {
      goPrev();
    } else {
      setShowGallery(true);
    }
  };

  const handleOpenPhoneModal = () => {
    if (!selectedSize) {
      toast.warn("Iltimos, oldin razmerni tanlang!");
      return;
    }
    if (cooldownTime > 0) {
      toast.warn(
        `Iltimos kuting! Yangi buyurtma berish uchun ${Math.ceil(
          cooldownTime / 60
        )} daqiqa qoldi.`
      );
      return;
    }
    setShowPhoneModal(true);
  };

  const handleSendOrder = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      toast.error("Iltimos, to'g'ri telefon raqam kiriting!");
      return;
    }

    const fullPhoneNumber = `+998${cleanPhone}`;

    setSubmitting(true);
    try {
      const orderData = {
        productId: product.id || product.shoeId || "N/A",
        productName:
          product.name ||
          `${product.brand || ""} ${product.model || ""}`.trim() ||
          "Oyoq kiyim",
        productImage: images[0] || "",
        price: product.price || 0,
        selectedSize: selectedSize,
        phone: fullPhoneNumber, // Admin panel uchun moslashtirildi
        clientPhone: fullPhoneNumber, // Zaxira uchun
        telegramId: String(tgUser.id),
        firstName: tgUser.first_name || "",
        lastName: tgUser.last_name || "",
        username: tgUser.username || "",
        photoUrl: tgUser.photo_url || "", // Foydalanuvchi rasmi
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);

      if (BOT_TOKEN && ADMIN_CHAT_ID) {
        const caption =
          `<b>🆕 YANGI BUYURTMA!</b>\n\n` +
          `👟 <b>Model:</b> ${orderData.productName}\n` +
          `🆔 <b>ID:</b> #${orderData.productId}\n` +
          `📏 <b>Razmer:</b> <code>${selectedSize}</code>\n` +
          `💰 <b>Narx:</b> $${orderData.price}\n` +
          `📞 <b>Telefon:</b> <code>${fullPhoneNumber}</code>\n\n` +
          `👤 <b>Mijoz:</b> ${tgUser.first_name} ${tgUser.last_name || ""} (@${
            tgUser.username || "yo'q"
          })\n` +
          `🆔 <b>Telegram ID:</b> <code>${tgUser.id}</code>`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          chat_id: ADMIN_CHAT_ID,
          photo: images[0] || "https://via.placeholder.com/300",
          caption: caption,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Tasdiqlash",
                  callback_data: `approve_order_${tgUser.id}_${orderData.productId}`,
                },
              ],
            ],
          },
        });
      }

      toast.success("Buyurtmangiz muvaffaqiyatli yuborildi!");

      const expireTime = Date.now() + 7 * 60 * 1000;
      localStorage.setItem(cooldownKey, expireTime.toString());
      setCooldownTime(7 * 60);

      setShowPhoneModal(false);
      setPhoneNumber("");
    } catch (error) {
      console.error("Buyurtma yuborishda xatolik:", error);
      toast.error("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000000] bg-[#112544] w-full h-full overflow-y-auto select-none"
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="w-full min-h-full flex flex-col relative pb-10">
          {/* RASMLAR CONTAINER */}
          <div
            className="relative w-full h-[38vh] bg-slate-900 shrink-0 overflow-hidden cursor-pointer"
            onClick={() => setShowGallery(true)}
          >
            {images.length > 0 ? (
              <div className="w-full h-full relative flex items-center justify-center">
                <motion.img
                  key={`main-shoe-img-${activeIndex}`}
                  src={images[activeIndex]}
                  alt={product.name || product.brand}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={handleDragEnd}
                  className="w-full h-full object-cover select-none cursor-grab active:cursor-grabbing"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                Rasm mavjud emas
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

            {/* CHIQISH TUGMASI */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform z-30"
            >
              <LuX size={22} />
            </button>

            {/* KATTALASHTIRISH TUGMASI */}
            {images.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGallery(true);
                }}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform z-30"
              >
                <LuExpand size={19} />
              </button>
            )}

            {/* INDIKATOR VA NUQTALAR */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 z-20 pointer-events-none">
                {activeIndex + 1} / {images.length}
              </div>
            )}

            {images.length > 1 && (
              <div
                className="absolute bottom-4 left-4 flex gap-1.5 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((_, i) => (
                  <button
                    key={`dot-btn-${i}`}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activeIndex ? "w-5 bg-amber-500" : "w-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ASOSIY MA'LUMOTLAR */}
          <div className="px-4 pt-5 bg-[#112544] mb-[30px] rounded-t-3xl relative z-10 -mt-4 flex-1">
            <h2 className="text-2xl font-extrabold text-white leading-tight mb-1">
              {product.name ||
                `${product.brand || ""} ${product.model || ""}`.trim() ||
                "Oyoq kiyim"}
            </h2>
            {product.listingId && (
              <div className="text-[11px] text-amber-500 font-mono mb-1">
                ID: #{product.listingId}
              </div>
            )}

            {/* NARX */}
            <PriceTag usd={product.price} size="lg" className="mb-3" />

            {/* RAZMERLAR */}
            {sizeList.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Mavjud razmerlar:
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {sizeList.map((sz, idx) => (
                    <button
                      key={`size-btn-${sz}-${idx}`}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedSize === sz
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105"
                          : "bg-[#0f192b] text-slate-300 border-slate-700 hover:border-amber-500/50"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TUSHUNTIRISH TEXTI */}
            <p className="text-[11px] text-amber-400/90 font-medium mb-3 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
              💡 Sotib olish uchun yuqoridagi mavjud razmerlardan birini bosing
              va pastdagi tugma orqali buyurtma bering.
            </p>

            {/* SOTIB OLISH VA ADMIN TUGMALARI */}
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                disabled={!selectedSize || cooldownTime > 0}
                onClick={handleOpenPhoneModal}
                className={`flex-1 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform text-sm font-extrabold ${
                  !selectedSize || cooldownTime > 0
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95"
                }`}
              >
                <LuShoppingBag size={18} />
                {cooldownTime > 0 ? (
                  <span className="flex items-center gap-1">
                    <LuClock size={16} /> {formatTime(cooldownTime)} kuting
                  </span>
                ) : (
                  "Sotib olish"
                )}
              </button>

              <a
                href={ADMIN_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-3.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform text-xs shrink-0"
              >
                <LuSend size={15} />
                Admin
              </a>
            </div>

            {/* XUSUSIYATLAR */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Oyoq kiyim xususiyatlari
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <StatChip
                icon={LuSettings2}
                label="Brend"
                value={product.brand}
              />
              <StatChip
                icon={LuSettings2}
                label="Model"
                value={product.model}
              />
              <StatChip
                icon={LuShieldCheck}
                label="Turi"
                value={product.category || product.type}
              />
              <StatChip
                icon={LuPalette}
                label="Material"
                value={product.material}
              />
            </div>

            {/* INSTAGRAM (VIDEO) TUGMASI */}
            {instagramUrl && (
              <div className="mb-5">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform cursor-pointer"
                >
                  <FaInstagram size={18} />
                  Mahsulot video sharhini ko'rish (Instagram)
                </a>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-slate-400 mb-5 px-1">
              <div className="flex items-center gap-1.5">
                <LuCalendar size={16} className="text-amber-500" />
                <span>{product.date || "Bugun"}</span>
              </div>
            </div>

            {product.description && (
              <div className="mb-10">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Tavsif
                </div>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0f192b] p-3.5 rounded-2xl border border-slate-700/60 shadow-sm">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* TELEFON RAQAM KIRITISH MODALI */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-[2000000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#112544] border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <LuX size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-500">
              <LuPhone size={24} />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Telefon raqamingizni kiriting
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Tez orada siz bilan bog'lanamiz va buyurtmangizni tasdiqlaymiz.
            </p>

            <form onSubmit={handleSendOrder} className="space-y-4">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-300 text-sm font-bold select-none">
                  +998
                </span>
                <input
                  type="tel"
                  maxLength={9}
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPhoneNumber(val);
                  }}
                  placeholder="901234567"
                  required
                  autoFocus
                  className="w-full pl-16 pr-4 py-3 rounded-2xl bg-[#0f192b] border border-slate-700 text-white text-sm outline-none focus:border-amber-500 tracking-wider font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-2xl text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                {submitting ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* FULLSCREEN GALLERY */}
      {showGallery && (
        <FullscreenGallery
          images={images}
          startIndex={activeIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </AnimatePresence>
  );
};

export default CarDetailModal;
