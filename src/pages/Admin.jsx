import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  LuUsers,
  LuLock,
  LuSend,
  LuImage,
  LuShoppingBag,
} from "react-icons/lu";
import { FiUploadCloud } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { sendBroadcast } from "../broadcastMessage";
import axios from "axios";

const ADMIN_PIN = "2026avtotek";
const IMGBB_API_KEY = "0bf75dea880937d78cf5e554ed16a2e1";

const Admin = () => {
  const [authorized, setAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState("orders");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [broadcastText, setBroadcastText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [broadcastResult, setBroadcastResult] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );
      if (response.data && response.data.data) {
        setImageUrl(response.data.data.url);
      }
    } catch (error) {
      console.error("Rasm yuklashda xatolik:", error);
      alert("Rasm yuklashda xatolik yuz berdi.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim() || users.length === 0 || sending) return;

    setSending(true);
    setBroadcastResult(null);
    setProgress({ sent: 0, total: users.length });

    const result = await sendBroadcast(
      users,
      broadcastText.trim(),
      imageUrl,
      (sent, total) => {
        setProgress({ sent, total });
      }
    );

    setBroadcastResult(result);
    setSending(false);
    setBroadcastText("");
    setImageUrl("");
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setAuthorized(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "approved",
        approvedAt: serverTimestamp(),
      });
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, status: "approved" } : ord
        )
      );
    } catch (error) {
      console.error("Buyurtmani tasdiqlashda xatolik:", error);
      alert("Tasdiqlashda xatolik yuz berdi.");
    }
  };

  useEffect(() => {
    if (!authorized) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const usersQuery = query(usersRef, orderBy("firstSeenAt", "desc"));
        const usersSnap = await getDocs(usersQuery);
        setUsers(
          usersSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );

        const ordersRef = collection(db, "orders");
        const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));
        const ordersSnap = await getDocs(ordersQuery);
        setOrders(
          ordersSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
      } catch (error) {
        console.error("Ma'lumotlarni yuklashda xatolik:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authorized]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "-";
    return timestamp.toDate().toLocaleString("ru-RU");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
        <form
          onSubmit={handlePinSubmit}
          className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-sm border border-slate-100"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 mx-auto">
            <LuLock size={20} className="text-slate-500" />
          </div>
          <h2 className="text-center font-bold text-slate-900 mb-4">
            Admin panel
          </h2>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError(false);
            }}
            placeholder="Parolni kiriting"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none mb-2 ${
              pinError
                ? "border-rose-500 ring-1 ring-rose-500"
                : "border-slate-200 focus:border-blue-500"
            }`}
          />
          {pinError && (
            <p className="text-rose-500 text-xs mb-2">Parol noto'g'ri.</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            Kirish
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 pb-20">
      <div className="flex bg-slate-200 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "orders"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LuShoppingBag size={16} className="text-amber-500" />
          <span>Buyurtmalar ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "users"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LuUsers size={16} className="text-blue-600" />
          <span>Foydalanuvchilar ({users.length})</span>
        </button>
      </div>

      {activeTab === "orders" && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LuShoppingBag size={22} className="text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">
              Kelib tushgan buyurtmalar
            </h1>
          </div>
          <p className="text-sm text-slate-500 mb-5">
            Jami buyurtmalar:{" "}
            <span className="font-bold text-slate-900">{orders.length}</span> ta
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 bg-slate-200 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    {order.productImage ? (
                      <img
                        src={order.productImage}
                        alt=""
                        className="w-16 h-16 object-cover rounded-xl shrink-0 bg-slate-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                        Rasm yo'q
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {order.productName || "Noma'lum mahsulot"}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Razmer:{" "}
                        <span className="font-bold text-slate-900">
                          {order.selectedSize || "-"}
                        </span>{" "}
                        | Narx:{" "}
                        <span className="font-bold text-amber-600">
                          ${order.price || 0}
                        </span>
                      </div>

                      {/* Xaridor haqida ma'lumotlar */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                        {order.photoUrl ? (
                          <img
                            src={order.photoUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {(order.firstName || "M").charAt(0)}
                          </div>
                        )}
                        <div className="text-xs text-slate-700 font-semibold truncate">
                          {order.firstName} {order.lastName}
                          {order.username && (
                            <span className="text-slate-400 font-normal">
                              {" "}
                              (@{order.username})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>
                          Tel:{" "}
                          <a
                            href={`tel:${order.phone || order.clientPhone}`}
                            className="font-semibold text-blue-600"
                          >
                            {order.phone || order.clientPhone || "Kiritilmagan"}
                          </a>
                        </span>
                        <span>
                          ID:{" "}
                          <code className="text-slate-400">
                            {order.telegramId || "-"}
                          </code>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          order.status === "approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        {order.status === "approved"
                          ? "✅ Tasdiqlangan"
                          : "⏳ Kutilmoqda"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <div>Sana: {formatDate(order.createdAt)}</div>
                    {order.status !== "approved" && (
                      <button
                        onClick={() => handleApproveOrder(order.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                      >
                        Tasdiqlash
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm py-16">
              Hozircha buyurtmalar yo'q.
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LuUsers size={22} className="text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Foydalanuvchilar
            </h1>
          </div>
          <p className="text-sm text-slate-500 mb-5">
            Jami:{" "}
            <span className="font-bold text-slate-900">{users.length}</span> ta
            foydalanuvchi
          </p>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <LuSend size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-slate-900">
                Hammaga xabar yuborish
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-2.5 px-3 rounded-xl cursor-pointer transition-colors border border-dashed border-slate-300">
                  <FiUploadCloud size={16} />
                  <span>
                    {uploadingImage
                      ? "Rasm yuklanmoqda..."
                      : "Rasmni qurilmadan tanlash"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || sending}
                    className="hidden"
                  />
                </label>
              </div>

              {imageUrl && (
                <div className="relative flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-xl">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0 text-xs text-blue-900 truncate">
                    Rasm tayyor!
                  </div>
                  <FaCheckCircle
                    className="text-blue-600 shrink-0 mr-1"
                    size={18}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-xs text-rose-500 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!imageUrl && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <LuImage size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Yoki rasm URL havolasini kiriting"
                    disabled={sending || uploadingImage}
                    className="w-full text-xs bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>

            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              rows={3}
              placeholder={`Masalan: "Yangi oyoq kiyimlar keldi! Ko'proq ma'lumot uchun botni oching."`}
              disabled={sending}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none mb-2 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={
                sending ||
                uploadingImage ||
                !broadcastText.trim() ||
                users.length === 0
              }
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-98 transition-transform"
            >
              {sending
                ? `Yuborilmoqda... (${progress.sent}/${progress.total})`
                : `Hammaga yuborish (${users.length} ta)`}
            </button>

            {broadcastResult && !sending && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                ✅ {broadcastResult.successCount} ta yuborildi
                {broadcastResult.failCount > 0 &&
                  ` · ❌ ${broadcastResult.failCount} ta yuborilmadi`}
              </p>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-16 bg-slate-200 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl p-3 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold shrink-0">
                        {(user.firstName || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">
                        {user.firstName} {user.lastName}
                        {user.username && (
                          <span className="text-slate-400 font-normal">
                            {" "}
                            @{user.username}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        ID: {user.telegramId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <div>Birinchi: {formatDate(user.firstSeenAt)}</div>
                    <div>Oxirgi: {formatDate(user.lastSeenAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm py-16">
              Hozircha foydalanuvchilar yo'q.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
