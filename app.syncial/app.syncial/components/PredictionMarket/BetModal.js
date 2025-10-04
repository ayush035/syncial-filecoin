import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usePredictionMarket } from '../../hooks/usePredictionMarket';

const BetModal = ({ pollId, onClose, onSuccess }) => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [option, setOption] = useState(true); // true for YES, false for NO
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const { handlePlaceBet, loading, hash, isConfirmed } = usePredictionMarket();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(amount) < 1) {
      setError('Minimum bet is 1 FIL');
      return;
    }

    // Check balance
    if (balance && parseEther(amount.toString()) > balance.value) {
      setError(`Insufficient balance. You have ${parseFloat(formatEther(balance.value)).toFixed(4)} FIL`);
      return;
    }

    try {
      console.log('Placing bet:', { pollId, option, amount });
      const txHash = await handlePlaceBet(pollId, option, parseFloat(amount));
      console.log('Bet transaction hash:', txHash);
    } catch (err) {
      console.error('Bet placement error:', err);
      
      // Handle specific error messages
      let errorMessage = 'Failed to place bet: ';
      if (err.message.includes('Poll ended')) {
        errorMessage += 'This poll has ended and no longer accepts bets.';
      } else if (err.message.includes('Bet below $1')) {
        errorMessage += 'Minimum bet is $1 USD equivalent in FIL.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient FIL balance for this bet plus gas fees.';
      } else if (err.message.includes('User rejected')) {
        errorMessage += 'Transaction was cancelled.';
      } else if (err.message.includes('gas')) {
        errorMessage += 'Transaction failed due to gas estimation. Try a smaller amount.';
      } else {
        errorMessage += err.reason || err.message;
      }
      
      setError(errorMessage);
    }
  };

  // Handle successful transaction
  if (isConfirmed && hash) {
    setTimeout(() => {
      onSuccess?.();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 bg-[#16030d] bg-opacity-10  flex items-center justify-center z-50">
      <div className="bg-[#16030d] outline outline-2 outline-[#39071f] p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Place Your Bet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Balance Display */}
        {balance && (
          <div className="mb-4 p-2 rounded">
            <p className="text-xs text-gray-100">
              Available: {parseFloat(formatEther(balance.value)).toFixed(4)} FIL
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {hash && !isConfirmed && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm"> Transaction pending...</p>
            <p className="text-xs font-mono text-yellow-600">{hash}</p>
          </div>
        )}

        {/* Success Message */}
        {isConfirmed && hash && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">Bet placed successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-xs text-red-600 hover:text-red-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">
              Your Prediction
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOption(true)}
                disabled={loading || isConfirmed}
                className={`flex-1 py-3 px-4 rounded font-semibold transition-colors disabled:opacity-50 ${
                  option
                    ? 'bg-[#ED3968] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-300'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setOption(false)}
                disabled={loading || isConfirmed}
                className={`flex-1 py-3 px-4 rounded font-semibold transition-colors disabled:opacity-50 ${
                  !option
                    ? 'bg-[#ED3968] text-white'
                    : ' bg-white text-black hover:bg-gray-300'
                }`}
              >
                NO
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white text-sm font-bold mb-2">
              Amount (FIL)
            </label>
            <div className="relative">
              <input
                type="number"
                step="5"
                min="1"
                max={balance ? formatEther(balance.value) : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#ED3968] pr-16"
                placeholder="6"
                required
                disabled={loading || isConfirmed}
              />
              <button
                type="button"
                onClick={() => {
                  if (balance) {
                    const maxAmount = Math.max(0, parseFloat(formatEther(balance.value)) - 0.01); // Leave some for gas
                    setAmount(maxAmount.toFixed(4));
                  }
                }}
                disabled={loading || isConfirmed || !balance}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs  text-[#ED3968] hover:text-rose-400 px-2 py-1 rounded disabled:opacity-50  cursor-pointer"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-100 mt-1">
              <span>Minimum: 1 FIL</span>
              <span>~1 FIL minimum</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white hover:bg-[#ED3968] hover:text-white disabled:bg-gray-300 text-black cursor-pointer font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || isConfirmed}
              className="flex-1 bg-[#ED3968] hover:bg-rose-400 cursor-pointer disabled:bg-rose-400 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {loading ? 'Processing...' : 
               isConfirmed ? '✅ Success!' :
               `Bet ${option ? 'YES' : 'NO'}`}
            </button>
          </div>

          {/* Bet Summary */}
          {amount && (
            <div className="mt-4 p-3 bg-blue-50 rounded border">
              <p className="text-sm font-semibold text-blue-800">Bet Summary:</p>
              <p className="text-xs text-blue-700">
                Betting {amount} FIL on <strong>{option ? 'YES' : 'NO'}</strong>
              </p>
              {balance && (
                <p className="text-xs text-blue-600">
                  Remaining balance: ~{(parseFloat(formatEther(balance.value)) - parseFloat(amount) - 0.01).toFixed(4)} FIL
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BetModal;