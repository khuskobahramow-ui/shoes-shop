import axios from "axios";

const CHANNEL_USERNAME = "forShoesDataBase";
const PROXY_TIMEOUT = 20000;
const NOT_PROVIDED = "";

export const fetchShoesFromTelegram = async () => {
  try {
    const targetUrl = `https://t.me/s/${CHANNEL_USERNAME}`;

    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(
        targetUrl
      )}`,
    ];

    let htmlText = "";

    async function tryProxy(proxyUrl) {
      const response = await axios.get(proxyUrl, {
        timeout: PROXY_TIMEOUT,
      });

      let data = response.data;

      if (data && typeof data === "object" && data.contents) {
        data = data.contents;
      }

      if (typeof data === "string" && data.includes("tgme_widget_message")) {
        return data;
      }

      throw new Error("Proksi noto'g'ri formatda javob berdi: " + proxyUrl);
    }

    try {
      htmlText = await Promise.any(proxies.map((url) => tryProxy(url)));
    } catch (aggregateError) {
      console.warn("Uchala proksi ham ishlamadi:", aggregateError);
    }

    if (!htmlText) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const messages = doc.querySelectorAll(".tgme_widget_message");

    const parsedShoes = [];

    messages.forEach((msg, index) => {
      const textNode = msg.querySelector(".tgme_widget_message_text");

      if (!textNode) {
        return;
      }

      let type = "market";
      let isSale = "no-sale";
      let shoeId = "";
      let status = "active";

      let name = "";
      let brand = NOT_PROVIDED;
      let model = NOT_PROVIDED;

      let price = 0;
      let priceUzs = 0;

      let startPrice = 0;
      let startPriceUzs = 0;
      let bidStep = 0;
      let bidStepUzs = 0;
      let endTime = NOT_PROVIDED;

      let sizes = NOT_PROVIDED;
      let color = NOT_PROVIDED;
      let material = NOT_PROVIDED;
      let gender = NOT_PROVIDED;
      let season = NOT_PROVIDED;

      let date = "Bugun";
      let instagram = NOT_PROVIDED;
      let description = NOT_PROVIDED;

      const images = [];

      const isSocialMediaUrl = (url) => {
        if (!url) return true;
        const lowerUrl = url.toLowerCase();
        return (
          lowerUrl.includes("instagram.com") ||
          lowerUrl.includes("youtube.com") ||
          lowerUrl.includes("youtu.be") ||
          lowerUrl.includes("t.me")
        );
      };

      const anchors = textNode.querySelectorAll("a");
      const anchorImageUrls = [];

      for (const anchor of anchors) {
        const href = anchor.getAttribute("href") || "";
        const isImage =
          (href.includes("cloudinary.com") ||
            href.includes("ibb.co") ||
            /\.(webp|jpg|jpeg|png)(\?.*)?$/i.test(href)) &&
          !isSocialMediaUrl(href);

        if (isImage) {
          anchorImageUrls.push(href);
        }
      }

      let formattedHtml = textNode.innerHTML
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<div>/gi, "");

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formattedHtml;

      const text = tempDiv.innerText || tempDiv.textContent || "";

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        const lowerLine = cleanLine.toLowerCase();

        if (lowerLine.startsWith("type:")) {
          const val = cleanLine.split(":")[1]?.trim().toLowerCase();
          if (val === "auction") type = "auction";
          else type = "market";
        } else if (lowerLine.startsWith("issale:")) {
          isSale = cleanLine.split(":")[1]?.trim().toLowerCase() || "no-sale";
        } else if (
          lowerLine.startsWith("status:") ||
          lowerLine.startsWith("holat:")
        ) {
          const val = cleanLine
            .substring(cleanLine.indexOf(":") + 1)
            .trim()
            .toLowerCase();
          if (
            val === "no-active" ||
            val === "noactive" ||
            val === "sotildi" ||
            val === "inactive"
          ) {
            status = "no-active";
          }
        } else if (lowerLine.startsWith("id:")) {
          shoeId = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (lowerLine.startsWith("brand:")) {
          brand = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (
          lowerLine.startsWith("card title:") ||
          lowerLine.startsWith("nomi:")
        ) {
          name = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (
          lowerLine.startsWith("ref. code / model:") ||
          lowerLine.startsWith("model:")
        ) {
          model = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (lowerLine.startsWith("price uzs:")) {
          const val = cleanLine.replace(/[^0-9]/g, "");
          priceUzs = val ? parseInt(val, 10) : 0;
        } else if (lowerLine.startsWith("price:")) {
          const val = cleanLine.replace(/[^0-9]/g, "");
          price = val ? parseInt(val, 10) : 0;
        } else if (lowerLine.startsWith("start price uzs:")) {
          const val = cleanLine.replace(/[^0-9]/g, "");
          startPriceUzs = val ? parseInt(val, 10) : 0;
        } else if (lowerLine.startsWith("start price:")) {
          const val = cleanLine.replace(/[^0-9]/g, "");
          startPrice = val ? parseInt(val, 10) : 0;
        } else if (lowerLine.startsWith("bid step uzs:")) {
          const val = cleanLine.replace(/[^0-9]/g, "");
          bidStepUzs = val ? parseInt(val, 10) : 0;
        } else if (lowerLine.startsWith("bid step:")) {
          const val = cleanLine.replace(/[^0-9]/g, "");
          bidStep = val ? parseInt(val, 10) : 0;
        } else if (lowerLine.startsWith("end time:")) {
          endTime = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        }
        // 🔥 RAZMERLARNI ANIQ USHLASH QISMI
        else if (
          lowerLine.startsWith("sizes:") ||
          lowerLine.startsWith("size:") ||
          lowerLine.startsWith("razmer:") ||
          lowerLine.startsWith("o'lcham:")
        ) {
          sizes = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (
          lowerLine.startsWith("color:") ||
          lowerLine.startsWith("rangi:")
        ) {
          color = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (lowerLine.startsWith("material:")) {
          material = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (lowerLine.startsWith("gender:")) {
          gender = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (lowerLine.startsWith("season:")) {
          season = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (
          lowerLine.startsWith("date:") ||
          lowerLine.startsWith("sana:")
        ) {
          date = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (lowerLine.startsWith("instagram:")) {
          instagram = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (
          lowerLine.startsWith("description:") ||
          lowerLine.startsWith("tavsif:")
        ) {
          description = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        } else if (
          /^image\d*:/i.test(lowerLine) ||
          /^rasm\d*:/i.test(lowerLine)
        ) {
          let extractedUrl = cleanLine
            .substring(cleanLine.indexOf(":") + 1)
            .trim();
          extractedUrl = extractedUrl.replace(/[),.]+$/, "");

          if (
            (extractedUrl.startsWith("http://") ||
              extractedUrl.startsWith("https://")) &&
            !isSocialMediaUrl(extractedUrl)
          ) {
            images.push(extractedUrl);
          }
        }
      });

      if (images.length === 0 && anchorImageUrls.length > 0) {
        images.push(...anchorImageUrls);
      }

      if (images.length === 0) {
        const photoNode = msg.querySelector(".tgme_widget_message_photo_wrap");
        if (photoNode) {
          const style = photoNode.getAttribute("style") || "";
          const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
          if (urlMatch && urlMatch[1] && !isSocialMediaUrl(urlMatch[1])) {
            images.push(urlMatch[1]);
          }
        }
      }

      if ((name || brand) && status !== "no-active") {
        const validImages = images.filter((img) => !isSocialMediaUrl(img));

        const item = {
          id: shoeId || `${index}-${name}`,
          shoeId: shoeId || "",
          type,
          isSale,
          status,
          name,
          brand,
          model,
          price,
          priceUzs,
          startPrice,
          startPriceUzs,
          bidStep,
          bidStepUzs,
          endTime,
          sizes, // <-- Razmerlar shu yerda to'g'ridan-to'g'ri obyektga qo'shiladi
          color,
          material,
          gender,
          season,
          date,
          instagram,
          description,
          images: validImages,
          image: validImages[0] || "",
        };

        parsedShoes.push(item);
      }
    });

    parsedShoes.reverse();
    return parsedShoes;
  } catch (error) {
    console.error("Telegramdan ma'lumot olishda xatolik:", error);
    return [];
  }
};

export const fetchWatchesFromTelegram = fetchShoesFromTelegram;
