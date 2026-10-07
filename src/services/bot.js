import { Telegraf } from "telegraf";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import http from "http";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Lokal .env faylini yuklash
dotenv.config();

// 1. Firebase Admin Sozlanmasi
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const parsed =
      typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;

    if (parsed && (parsed.private_key || parsed.privateKey)) {
      serviceAccount = parsed;
    }
  } catch (e) {
    // .env parsing xatosi
  }
}

if (!serviceAccount) {
  const localKeyPath = path.join(
    process.cwd(),
    "src",
    "services",
    "serviceAccountKey.json"
  );
  if (fs.existsSync(localKeyPath)) {
    try {
      const rawData = fs.readFileSync(localKeyPath, "utf8");
      serviceAccount = JSON.parse(rawData);
    } catch (e) {
      console.error("❌ serviceAccountKey.json faylini o'qishda xatolik:", e);
    }
  }
}

if (!serviceAccount) {
  console.error(
    "❌ Firebase Service Account topilmadi! (.env yoki serviceAccountKey.json tayyorligini tekshiring)"
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 2. Telegram Bot Sozlanmasi
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN topilmadi!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Ijtimoiy tarmoq linklarini filtrlash uchun yordamchi funksiya
function isSocialMediaUrl(url) {
  if (!url) return true;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("instagram.com") ||
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("youtu.be") ||
    lowerUrl.includes("t.me")
  );
}

// 3. Post Parser Funksiyasi (Shoes va Auction uchun)
function parseShoesPost(text, messageId) {
  if (!text) return null;

  const lines = text.split("\n");
  const data = {
    id: `post_${messageId}`,
    messageId: messageId,
    updatedAt: new Date(),
  };

  let isAuction = false;
  let isSale = "no-sale";
  let type = "market";

  const images = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("---")) return;

    const lowerLine = trimmedLine.toLowerCase();

    // TYPE va IS_SALE
    if (lowerLine.startsWith("type:")) {
      const typeVal = trimmedLine.split(":")[1]?.trim().toLowerCase() || "";
      if (typeVal === "auction") {
        isAuction = true;
        type = "auction";
      } else {
        type = "market";
      }
    }

    if (lowerLine.startsWith("issale:")) {
      isSale = trimmedLine.split(":")[1]?.trim().toLowerCase() || "no-sale";
    }

    if (
      trimmedLine.includes("🔥 AUCTION POST 🔥") ||
      trimmedLine.includes("🔥 AUKSION POSTI 🔥")
    ) {
      isAuction = true;
      type = "auction";
    }

    // MAIN DATA
    if (lowerLine.startsWith("id:"))
      data.shoeId = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    if (lowerLine.startsWith("status:") || lowerLine.startsWith("holat:"))
      data.status = trimmedLine
        .substring(trimmedLine.indexOf(":") + 1)
        .trim()
        .toLowerCase();
    if (lowerLine.startsWith("brand:"))
      data.brand = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    if (lowerLine.startsWith("card title:") || lowerLine.startsWith("nomi:"))
      data.name = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    if (
      lowerLine.startsWith("ref. code / model:") ||
      lowerLine.startsWith("ref. code:") ||
      lowerLine.startsWith("model:")
    ) {
      data.model = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    }

    // PRICES (Market / Regular)
    if (lowerLine.startsWith("price:") && !lowerLine.includes("uzs"))
      data.price = Number(trimmedLine.replace(/[^0-9]/g, "")) || 0;
    if (
      lowerLine.startsWith("price uzs:") ||
      lowerLine.startsWith("narxi uzs:")
    )
      data.priceUzs = Number(trimmedLine.replace(/[^0-9]/g, "")) || 0;

    // PRICES (Auction)
    if (lowerLine.startsWith("start price:") && !lowerLine.includes("uzs")) {
      data.startPrice = Number(trimmedLine.replace(/[^0-9]/g, "")) || 0;
    }
    if (lowerLine.startsWith("start price uzs:")) {
      data.startPriceUzs = Number(trimmedLine.replace(/[^0-9]/g, "")) || 0;
    }
    if (lowerLine.startsWith("bid step:") && !lowerLine.includes("uzs")) {
      data.bidStep = Number(trimmedLine.replace(/[^0-9]/g, "")) || 0;
    }
    if (lowerLine.startsWith("bid step uzs:")) {
      data.bidStepUzs = Number(trimmedLine.replace(/[^0-9]/g, "")) || 0;
    }
    if (lowerLine.startsWith("end time:")) {
      data.endTime = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    }

    // 🔥 SPECS (RAZMERLARNI ANIQ USHLASH)
    if (
      lowerLine.startsWith("sizes:") ||
      lowerLine.startsWith("size:") ||
      lowerLine.startsWith("razmer:") ||
      lowerLine.startsWith("o'lcham:")
    ) {
      const extractedSizes = trimmedLine
        .substring(trimmedLine.indexOf(":") + 1)
        .trim();
      data.sizes = extractedSizes;
      data.size = extractedSizes; // Frontend xavfsizligi uchun ikkalasiga ham yozamiz
    }

    if (lowerLine.startsWith("color:") || lowerLine.startsWith("rangi:"))
      data.color = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    if (lowerLine.startsWith("material:"))
      data.material = trimmedLine
        .substring(trimmedLine.indexOf(":") + 1)
        .trim();
    if (lowerLine.startsWith("gender:") || lowerLine.startsWith("jinsi:"))
      data.gender = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    if (lowerLine.startsWith("season:") || lowerLine.startsWith("mavsum:"))
      data.season = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();

    // META
    if (lowerLine.startsWith("date:") || lowerLine.startsWith("sana:"))
      data.date = trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim();
    if (lowerLine.startsWith("instagram:"))
      data.instagram = trimmedLine
        .substring(trimmedLine.indexOf(":") + 1)
        .trim();
    if (lowerLine.startsWith("description:") || lowerLine.startsWith("tavsif:"))
      data.description = trimmedLine
        .substring(trimmedLine.indexOf(":") + 1)
        .trim();

    // IMAGES (Ijtimoiy tarmoq linklarini filtrlab olib tashlash)
    if (
      trimmedLine.match(/^(Rasm|Image)\d*:/i) ||
      trimmedLine.includes("http://") ||
      trimmedLine.includes("https://")
    ) {
      const urlMatches = trimmedLine.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatches) {
        urlMatches.forEach((url) => {
          const cleanUrl = url.replace(/[),.]+$/, "");
          if (!isSocialMediaUrl(cleanUrl)) {
            images.push(cleanUrl);
          }
        });
      }
    }
  });

  const validImages = images.filter((img) => !isSocialMediaUrl(img));

  data.isAuction = isAuction;
  data.isSale = isSale;
  data.type = type;
  data.images = validImages;
  data.image = validImages[0] || "";

  return data;
}

// 4. Telegram Event-larni Eshitish
bot.on(["message", "channel_post", "edited_channel_post"], async (ctx) => {
  try {
    const post = ctx.channelPost || ctx.editedChannelPost || ctx.message;
    const text = post.caption || post.text || "";

    if (!text || !text.trim()) return;

    const shoeData = parseShoesPost(text, post.message_id);
    if (!shoeData || (!shoeData.name && !shoeData.brand)) return;

    let targetCollection = "shoes";
    if (shoeData.isAuction) {
      targetCollection = "auctions";
    }

    await db
      .collection(targetCollection)
      .doc(`post_${post.message_id}`)
      .set(shoeData, { merge: true });

    console.log(`✅ Saqlandi [${targetCollection}]: post_${post.message_id}`);
  } catch (err) {
    console.error("❌ Firestore Error:", err);
  }
});

// 5. Render Health Check Server
const PORT = process.env.PORT || 10000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Shoes Bot Active");
  })
  .listen(PORT, () => {
    console.log(`🌐 Web server ${PORT}-portda ishlamoqda...`);
  });

// 6. Botni Ishga Tushirish
bot
  .launch()
  .then(() => console.log("🤖 Shoes Outlet Bot muvaffaqiyatli ishga tushdi!"))
  .catch((err) => console.error("❌ Botni ishga tushirishda xatolik:", err));

// Graceful Shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
