// hooks/useUsernameContract.js
import { useReadContract } from 'wagmi';

const USERNAME_CONTRACT_ADDRESS = '0x25C66b57149495A196dA2c1180a02dB847493460'; // Replace with your actual address

const USERNAME_ABI = [
  {
    inputs: [{ internalType: "address", name: "_wallet", type: "address" }],
    name: "getUsernameFromWallet",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "usernames",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
];

export const useUsernameContract = () => {
  return {
    contractAddress: USERNAME_CONTRACT_ADDRESS,
    abi: USERNAME_ABI
  };
};