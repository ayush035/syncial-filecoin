import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePollData, useUserBets, useContract } from '../../hooks/useContract';
import BetModal from './BetModal';

const PollCard = ({ pollId }) => {
  const { address } = useAccount();
  const { data: pollData, isLoading: pollLoading, error: pollError, refetch } = usePollData(pollId);
  const { data: userBets, refetch: refetchUserBets } = useUserBets(pollId, address);
  
  const { placeBet, resolvePoll, updateMaxPrice } = useContract();

  // Debug: Log what the contract hook returns
  console.log('Contract hook returns:', { 
    resolvePoll: typeof resolvePoll, 
    updateMaxPrice: typeof updateMaxPrice,
    resolvePollMethods: resolvePoll ? Object.keys(resolvePoll) : 'null',
    updateMaxPriceMethods: updateMaxPrice ? Object.keys(updateMaxPrice) : 'null'
  });

  const [showBetModal, setShowBetModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Refresh poll data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      const timer = setTimeout(() => {
        refetch();
        refetchUserBets();
        setTxHash(null);
        setIsConfirmed(false);
        setLoading(false);
        setError('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, txHash, refetch, refetchUserBets]);

  // Force refresh when component mounts and when pollId changes
  useEffect(() => {
    refetch();
  }, [pollId, refetch]);

  // Auto-refresh poll data periodically to catch state changes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refetch]);

  if (pollLoading) return <div className="p-4 bg-white rounded-lg shadow-md animate-pulse">Loading poll...</div>;
  if (pollError) return <div className="p-4 bg-white rounded-lg shadow-md text-red-500">Error loading poll: {pollError.message}</div>;
  if (!pollData || pollData.length === 0) return <div className="p-4 bg-white rounded-lg shadow-md text-gray-500">No poll data available</div>;

  // Parse poll data with better error handling and validation
  const question = pollData[0] || 'Unknown Question';
  const endTime = Number(pollData[2]);
  const targetPrice = pollData[5];
  const maxPriceDuringPoll = pollData[6];
  const totalYes = pollData[7];
  const totalNo = pollData[8];
  const isResolved = Boolean(pollData[9]);
  const host = pollData[10];

  // Validate that we have valid poll data
  if (endTime === 0 || !question || question === 'Unknown Question') {
    console.warn(`Poll ${pollId} has invalid data:`, pollData);
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-md">
      <p className="text-yellow-800">Poll data is loading or invalid. Poll ID: {pollId}</p>
      <button 
        onClick={() => refetch()} 
        className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm"
      >
        Retry
      </button>
    </div>;
  }

  const convertToFIL = (value) => {
    if (!value) return '0.0000';
    const num = typeof value === 'bigint' ? Number(value) : Number(value);
    return (num / 1e8).toFixed(4);
  };

  const totalYesFIL = convertToFIL(totalYes);
  const totalNoFIL = convertToFIL(totalNo);
  const totalPoolFIL = (parseFloat(totalYesFIL) + parseFloat(totalNoFIL)).toFixed(4);

  const userYesFIL = userBets ? convertToFIL(userBets[0]) : '0.0000';
  const userNoFIL = userBets ? convertToFIL(userBets[1]) : '0.0000';

  const maxPriceFIL = convertToFIL(maxPriceDuringPoll);
  const targetPriceFIL = convertToFIL(targetPrice);

  // Fixed time comparison - handle both seconds and milliseconds timestamps
  const now = Date.now();
  const pollEndTime = endTime > 1e12 ? endTime : endTime * 1000; // Convert to milliseconds if needed
  const isActive = now < pollEndTime && !isResolved;
  const canResolve = now >= pollEndTime && !isResolved;

  // Debug logging with more detailed info
  console.log(`Poll ${pollId} Debug:`, {
    pollData,
    rawEndTime: pollData[2],
    parsedEndTime: endTime,
    now: new Date(now).toISOString(),
    endTime: new Date(pollEndTime).toISOString(),
    isActive,
    isResolved,
    canResolve,
    question: question.substring(0, 50) + '...'
  });

  const handleResolve = async () => {
    if (!canResolve) {
      setError('Poll cannot be resolved yet or is already resolved');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let hash;
      
      // Handle different contract hook patterns
      if (resolvePoll?.writeAsync) {
        // wagmi v1+ pattern
        hash = await resolvePoll.writeAsync({ args: [BigInt(pollId)] });
      } else if (resolvePoll?.write) {
        // wagmi v0.x pattern  
        hash = await resolvePoll.write({ args: [BigInt(pollId)] });
      } else if (typeof resolvePoll === 'function') {
        // Direct function call
        hash = await resolvePoll(BigInt(pollId));
      } else {
        throw new Error('resolvePoll function not available');
      }
      
      setTxHash(hash);
      setIsConfirmed(true);
    } catch (err) {
      console.error('Resolve poll error:', err);
      setError(err.reason || err.message || 'Failed to resolve poll');
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!isActive) {
      setError('Poll is no longer active');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let hash;
      
      // Handle different contract hook patterns
      if (updateMaxPrice?.writeAsync) {
        // wagmi v1+ pattern
        hash = await updateMaxPrice.writeAsync({ args: [BigInt(pollId)] });
      } else if (updateMaxPrice?.write) {
        // wagmi v0.x pattern
        hash = await updateMaxPrice.write({ args: [BigInt(pollId)] });
      } else if (typeof updateMaxPrice === 'function') {
        // Direct function call
        hash = await updateMaxPrice(BigInt(pollId));
      } else {
        throw new Error('updateMaxPrice function not available');
      }
      
      setTxHash(hash);
      setIsConfirmed(true);
    } catch (err) {
      console.error('Update price error:', err);
      setError(err.reason || err.message || 'Failed to update price');
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isResolved) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Resolved</span>;
    }
    if (isActive) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span>;
    }
    return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Ended</span>;
  };

  return (
    <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold flex-1 text-white">{question}</h3>
        {getStatusBadge()}
      </div>

      {/* Poll Stats */}
      <div className="text-md text-white mb-4">
        <p>Total Pool: <span className="font-semibold">{totalPoolFIL} FIL</span></p>
        <p>Yes Pool: <span className="font-semibold">{totalYesFIL} FIL</span></p>
        <p>No Pool: <span className="font-semibold">{totalNoFIL} FIL</span></p>
        <p>Max Price During Poll: <span className="font-semibold">{maxPriceFIL}</span></p>
        <p>Target Price: <span className="font-semibold">{targetPriceFIL}</span></p>
        <p>Host: <span className="font-mono text-xs">{host.slice(0, 6)}...{host.slice(-4)}</span></p>
        <p>End Time: {new Date(pollEndTime).toLocaleString()}</p>
        {/* Debug info - remove in production */}
        {/* <p className="text-xs opacity-50">
          Poll ID: {pollId} | Status: {isActive ? 'Active' : 'Ended'} | Resolved: {isResolved ? 'Yes' : 'No'} | Raw EndTime: {endTime}
        </p> */}
      </div>

      {/* User Bets */}
      {(parseFloat(userYesFIL) > 0 || parseFloat(userNoFIL) > 0) && (
        <div className="mb-4 p-3 bg-[#16030d]  rounded">
          <p className="text-sm font-semibold text-White mb-1">Your Bets:</p>
          <div className="flex gap-4 text-sm">
            <span className="text-[#ED3968]">YES: {userYesFIL} FIL</span>
            <span className="text-white">NO: {userNoFIL} FIL</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        {isActive && (
          <>
            <button
              onClick={() => setShowBetModal(true)}
              disabled={loading}
              className="flex-1 bg-[#ED3968] cursor-pointer hover:bg-rose-400 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded transition-colors"            >
              {loading ? 'Processing...' : 'Place Bet'}
            </button>
            <button
              onClick={handleUpdatePrice}
              disabled={loading}
              className="bg-white cursor-pointer hover:bg-gray-200 disabled:bg-gray-200 text-black font-bold py-2 px-4 rounded transition-colors"            >
              {loading ? 'Updating...' : 'Update Price'}
            </button>
          </>
        )}
        {canResolve && (
          <button
            onClick={handleResolve}
            disabled={loading}
            className="flex-1 bg-[#ED3968] cursor-pointer hover:bg-rose-400 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded transition-colors"          >
            {loading ? 'Resolving...' : 'Resolve Poll'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success/Loading States */}
      {loading && !error && (
        <div className="mb-4 p-3 rounded">
          <p className="text-sm text-blue-800">Transaction in progress...</p>
        </div>
      )}

      {showBetModal && (
        <BetModal
          pollId={pollId}
          onClose={() => setShowBetModal(false)}
          onSuccess={() => {
            setShowBetModal(false);
            // Immediate refresh after successful bet
            setTimeout(() => {
              refetch();
              refetchUserBets();
            }, 500);
          }}
        />
      )}
    </div>
  );
};

export default PollCard;