import { useState, useCallback } from 'react';
import { parseEther } from 'viem';
import { useContract } from './useContract';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

export const usePredictionMarket = () => {
  const { address } = useAccount();
  const { createPoll, placeBet, resolvePoll, updateMaxPrice, hash, error } = useContract();
  const [loading, setLoading] = useState(false);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleCreatePoll = useCallback(
    async (pollData) => {
      setLoading(true);
      try {
        console.log('Creating poll with data:', pollData);
        const txHash = await createPoll(pollData);
        console.log('Poll creation transaction:', txHash);
        return txHash;
      } finally {
        setLoading(false);
      }
    },
    [createPoll]
  );

  const handlePlaceBet = useCallback(
    async (pollId, option, amount) => {
      setLoading(true);
      try {
        console.log('Placing bet:', { pollId, option, amount });
        // parse amount to wei here
        const txHash = await placeBet(pollId, option, parseEther(amount.toString()));
        console.log('Bet transaction:', txHash);
        return txHash;
      } finally {
        setLoading(false);
      }
    },
    [placeBet]
  );

  const handleResolvePoll = useCallback(
    async (pollId) => {
      setLoading(true);
      try {
        console.log('Resolving poll:', pollId);
        const txHash = await resolvePoll(pollId);
        console.log('Resolution transaction:', txHash);
        return txHash;
      } finally {
        setLoading(false);
      }
    },
    [resolvePoll]
  );

  const handleUpdateMaxPrice = useCallback(
    async (pollId) => {
      try {
        console.log('Updating max price for poll:', pollId);
        const txHash = await updateMaxPrice(pollId);
        console.log('Price update transaction:', txHash);
        return txHash;
      } catch (err) {
        console.error('Error updating max price:', err);
        throw err;
      }
    },
    [updateMaxPrice]
  );

  return {
    handleCreatePoll,
    handlePlaceBet,
    handleResolvePoll,
    handleUpdateMaxPrice,
    loading: loading || isConfirming,
    isConfirmed,
    hash,
    error,
  };
};
