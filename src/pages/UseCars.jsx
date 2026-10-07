import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useCars() {
  // Komponentlaringizda import xatosi bo'lmasligi uchun nomini useCars qilib saqlab turdik
  const [cars, setCars] = useState([]); // Yangi oyoq kiyimlar
  const [usedCars, setUsedCars] = useState([]); // Ishlatilgan (B/U)
  const [installmentCars, setInstallmentCars] = useState([]); // Muddatli to'lov (Nasiya)
  const [allCars, setAllCars] = useState([]); // Barchasi

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Oldingi "watches" yoki REST API kesh o'rniga to'g'ridan-to me'yoriy Real-time Snapshot
    // Telegram botingiz qaysi kolleksiyaga yozayotgan bo'lsa o'shani o'qiydi (masalan "shoes" yoki "watches")
    const q = query(collection(db, "watches"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const formattedNew = [];
        const formattedUsed = [];
        const formattedInstallment = [];

        const combinedAll = snapshot.docs.map((doc) => {
          const data = doc.data();
          const id = doc.id;
          const type = String(data.type || "").toLowerCase();

          const isUsed =
            data.isUsed === true ||
            type === "used" ||
            type === "ishlatilgan" ||
            type === "b/u";

          const isInstallment =
            data.isInstallment === true ||
            type === "installment" ||
            type === "nasiya";

          const item = {
            id,
            ...data,
            isUsed,
            isInstallment,
            type: type || "market",
          };

          if (isUsed) {
            formattedUsed.push(item);
          } else if (isInstallment) {
            formattedInstallment.push(item);
          } else {
            formattedNew.push(item);
          }

          return item;
        });

        setCars(formattedNew);
        setUsedCars(formattedUsed);
        setInstallmentCars(formattedInstallment);
        setAllCars(combinedAll);

        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Firebase Snapshot xatoligi:", error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    // Real-time listen bo'lgani uchun alohida qayta yuklash shart emas, ammo tugma bosilganda darhol holatni yangilaydi
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return {
    cars,
    usedCars,
    installmentCars,
    allCars,
    loading,
    refreshing,
    refresh,
  };
}

export default useCars;
