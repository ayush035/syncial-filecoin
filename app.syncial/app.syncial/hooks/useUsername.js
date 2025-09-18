import { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { ethers } from "ethers";

// 0G Galileo Testnet contract details
const CONTRACT_ADDRESS = "0x0E51e917f9B397CF654Ad009B2b60ae2d7525b46";
const ABI = [
  {
    inputs: [{ internalType: "address", name: "_wallet", type: "address" }],
    name: "checkUsernameFromRainbow",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

// Public RPC endpoint for 0G Galileo Testnet
const PUBLIC_RPC = "https://evmrpc-testnet.0g.ai";

// Cache to avoid repeated calls for the same address
const usernameCache = new Map();

export function useUsername(walletAddress) {
  const { data: walletClient } = useWalletClient();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setUsername("");
      return;
    }

    // Check cache first
    if (usernameCache.has(walletAddress)) {
      setUsername(usernameCache.get(walletAddress));
      return;
    }

    resolveUsername(walletAddress);
  }, [walletAddress, walletClient]);

  const resolveUsername = async (address) => {
    setLoading(true);
    try {
      let provider;

      if (walletClient) {
        // Use wagmi wallet client (works for desktop + mobile)
        provider = new ethers.BrowserProvider(walletClient.transport);
      } else {
        // Fallback to public RPC if no wallet connected
        provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const resolvedUsername = await contract.checkUsernameFromRainbow(address);

      // Cache the result
      usernameCache.set(address, resolvedUsername);
      setUsername(resolvedUsername);
    } catch (err) {
      console.error("Error resolving username:", err);
      // Cache empty string to avoid repeated failed calls
      usernameCache.set(address, "");
      setUsername("");
    } finally {
      setLoading(false);
    }
  };

  return { username, loading };
}