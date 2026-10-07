import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useCars() {
  const [cars, setCars] = useState([]);
  const [usedCars, setUsedCars] = useState([]);
  const [installmentCars, setInstallmentCars] = useState([]);
  const [allCars, setAllCars] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Bazada "watches" ham, "shoes" ham bo'lishi mumkinligi uchun "watches" ga ulaymiz
    const qShoes = query(collection(db, "watches"));
    const qAuctions = query(collection(db, "auctions"));

    let shoesList = [];
    let auctionsList = [];

    const updateStates = () => {
      // Status 'no-active' bo'lmagan barchasini ko'rsatish (status kiritilmagan bo'lsa ham ko'rsatadi)
      const activeShoes = shoesList.filter(
        (item) => String(item.status || "active").toLowerCase() !== "no-active"
      );
      const activeAuctions = auctionsList.filter(
        (item) => String(item.status || "active").toLowerCase() !== "no-active"
      );

      const saleList = activeShoes.filter(
        (item) => String(item.isSale).toLowerCase() === "sale"
      );

      setCars(activeShoes);
      setUsedCars(saleList);
      setInstallmentCars(activeAuctions);
      setAllCars([...activeShoes, ...activeAuctions]);

      setLoading(false);
      setRefreshing(false);
    };

    const unsubShoes = onSnapshot(
      qShoes,
      (snapshot) => {
        shoesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: doc.data().type || "market",
        }));
        updateStates();
      },
      (error) => {
        console.error("Snapshot xatoligi:", error);
        setLoading(false);
      }
    );

    const unsubAuctions = onSnapshot(
      qAuctions,
      (snapshot) => {
        auctionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "auction",
        }));
        updateStates();
      },
      (error) => {
        console.error("Auctions snapshot xatoligi:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubShoes();
      unsubAuctions();
    };
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
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
