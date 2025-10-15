import { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { ethers } from "ethers";

// 0G Galileo Testnet contract details
const CONTRACT_ADDRESS = "0x25C66b57149495A196dA2c1180a02dB847493460";
const ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "UsernameMinted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_wallet",
				"type": "address"
			}
		],
		"name": "checkUsernameFromRainbow",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_wallet",
				"type": "address"
			}
		],
		"name": "getUsernameFromWallet",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "isUsernameAvailable",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "mintUsername",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "usernames",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "walletToUsername",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
// Public RPC endpoint for 0G Galileo Testnet
// const PUBLIC_RPC = "https://evmrpc-testnet.0g.ai";

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