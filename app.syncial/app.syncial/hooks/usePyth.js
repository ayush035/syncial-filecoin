// hooks/usePyth.js
import { useEffect, useState } from "react";
import { HermesClient } from "@pythnetwork/hermes-client";
import { PRICE_FEEDS } from "@/lib/config2";

const connection = new HermesClient("https://hermes.pyth.network");

export const usePyth = () => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const priceIds = Object.values(PRICE_FEEDS);

        // ✅ HermesClient API
        const updates = await connection.getLatestPriceUpdates(priceIds);

        const priceMap = {};
        priceIds.forEach((feedId, idx) => {
          const parsed = updates.parsed[idx];
          if (parsed && parsed.price) {
            priceMap[feedId] = {
              price: parsed.price.price,      // integer price
              expo: parsed.price.expo,        // decimal exponent
              publishTime: parsed.price.publishTime,
            };
          }
        });

        setPrices(priceMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Pyth prices:", error);
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // refresh every 10s

    return () => clearInterval(interval);
  }, []);

  const getFormattedPrice = (feedId) => {
    const priceData = prices[feedId];
    if (!priceData) return null;

    const price = priceData.price * Math.pow(10, priceData.expo);
    return price.toFixed(2);
  };

  return {
    prices,
    loading,
    getFormattedPrice,
    connection,
  };
};
