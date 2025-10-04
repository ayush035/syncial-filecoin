import { useReadContract, useWriteContract } from 'wagmi';
import { PREDICTION_MARKET_ADDRESS } from '@/lib/config2';
import CONTRACT_ABI from '@/abi/HBARPredictionMarketplace.json';

export const useContract = () => {
  // one writeContractAsync handles all write actions
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();

  // --- Write functions ---

  const createPoll = async (pollData) => {
    return writeContractAsync({
      address: PREDICTION_MARKET_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createPoll',
      args: [
        pollData.question,
        BigInt(pollData.duration),
        pollData.assetPriceId,
        pollData.hbarPriceId,
        BigInt(pollData.targetPrice),
      ],
      // gas: 800000n,
    });
  };

  const placeBet = async (pollId, option, amount) => {
    return writeContractAsync({
      address: PREDICTION_MARKET_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'placeBet',
      args: [BigInt(pollId), option], // option is true/false
      value: amount, // already parseEther before passing in
      // gas: 500000n,
    });
  };

  const resolvePoll = async (pollId) => {
    return writeContractAsync({
      address: PREDICTION_MARKET_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'resolvePoll',
      args: [BigInt(pollId)],
      // gas: 600000n,
    });
  };

  const updateMaxPrice = async (pollId) => {
    return writeContractAsync({
      address: PREDICTION_MARKET_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'updateMaxPrice',
      args: [BigInt(pollId)],
      // gas: 300000n,
    });
  };

  // --- Expose API ---
  return {
    createPoll,
    placeBet,
    resolvePoll,
    updateMaxPrice,
    hash,
    isPending,
    error,
  };
};

// --- Read helpers ---

export const usePollData = (pollId) => {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'polls',
    args: [pollId],
    query: {
      refetchInterval: 10000,
      enabled: pollId !== undefined && pollId !== null,
    },
  });
};

export const useUserBets = (pollId, userAddress) => {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserBets',
    args: [pollId, userAddress],
    query: {
      enabled: !!userAddress && pollId !== undefined,
      refetchInterval: 10000,
    },
  });
};

export const usePollCount = () => {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pollCount',
    query: {
      refetchInterval: 30000,
    },
  });
};
