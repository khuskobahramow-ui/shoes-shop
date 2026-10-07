import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useCars() {
  const [cars, setCars] = useState([]); // Barcha active oyoq kiyimlar (shoes)
  const [usedCars, setUsedCars] = useState([]); // Sale (Skidkadagi) mahsulotlar (IsSale === "sale")
  const [installmentCars, setInstallmentCars] = useState([]); // Auksiondagi mahsulotlar (auctions)
  const [allCars, setAllCars] = useState([]); // Barchasi jamlanmasi

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Firestore to'plamlariga so'rov (shoes va auctions)
    const qShoes = query(collection(db, "shoes"));
    const qAuctions = query(collection(db, "auctions"));

    let shoesList = [];
    let auctionsList = [];

    const updateStates = () => {
      // Status active bo'lganlarni filtrlash
      const activeShoes = shoesList.filter(
        (item) => String(item.status).toLowerCase() === "active"
      );
      const activeAuctions = auctionsList.filter(
        (item) => String(item.status).toLowerCase() === "active"
      );

      // Sale (skidka) va oddiy mahsulotlarga ajratish
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

    // Shoes collection eshituvchisi
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
        console.error("Shoes snapshot xatoligi:", error);
        setLoading(false);
      }
    );

    // Auctions collection eshituvchisi
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
