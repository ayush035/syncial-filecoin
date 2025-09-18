"use client";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import Navbar from "../components/Navbar"; // adjust path if needed

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

export default function Profile() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      resolveUsername(address);
    }
  }, [address, walletClient]);

  const resolveUsername = async (walletAddress) => {
    setLoading(true);
    try {
      let provider;

      if (walletClient) {
        // ✅ use wagmi wallet client (works for desktop + mobile)
        provider = new ethers.BrowserProvider(walletClient.transport);
      } else {
        // ✅ fallback to public RPC if no wallet connected
        provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const resolvedUsername = await contract.checkUsernameFromRainbow(walletAddress);

      setUsername(resolvedUsername);
    } catch (err) {
      console.error("Error resolving username:", err);
      setUsername("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="my-8">
        <h1 className="text-[#ED3968] font-semibold text-lg">GM,</h1>
        {loading ? (
          <p>Loading your username...</p>
        ) : username ? (
          <div className="text-[#ED3968] text-5xl font-bold font-sans">
            {username} 👋
          </div>
        ) : (
          <p className="text-white">No username found. Please mint one!</p>
        )}
      </div>
    </>
  );
}
