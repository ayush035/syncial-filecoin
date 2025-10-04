import { useState } from 'react';
import { PRICE_FEEDS } from '@/lib/config2';
import { usePredictionMarket } from '../../hooks/usePredictionMarket';


const CreatePoll = () => {
  const [formData, setFormData] = useState({
    question: '',
    duration: 24, // hours
    assetPriceId: PRICE_FEEDS.ETH_USD,
    targetPrice: '',
  });
  const [error, setError] = useState('');

  const { handleCreatePoll, loading, hash, isConfirmed } = usePredictionMarket();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.question.trim()) {
      setError('Question is required');
      return;
    }
    
    if (!formData.targetPrice || parseFloat(formData.targetPrice) <= 0) {
      setError('Please enter a valid target price');
      return;
    }
    
    try {
      const durationInSeconds = formData.duration * 3600; // Convert hours to seconds
      // Convert target price to int256 with 8 decimals (Pyth format)
      const targetPriceWithDecimals = Math.floor(parseFloat(formData.targetPrice) * 1e8);

      console.log('Submitting poll:', {
        question: formData.question,
        duration: durationInSeconds,
        assetPriceId: formData.assetPriceId,
        hbarPriceId: PRICE_FEEDS.HBAR_USD,
        targetPrice: targetPriceWithDecimals,
      });

      const txHash = await handleCreatePoll({
        question: formData.question,
        duration: durationInSeconds,
        assetPriceId: formData.assetPriceId,
        hbarPriceId: PRICE_FEEDS.HBAR_USD,
        targetPrice: targetPriceWithDecimals,
      });

      console.log('Poll creation transaction hash:', txHash);

    } catch (error) {
      console.error('Create poll error:', error);
      setError(error.message || 'Failed to create poll');
    }
  };

  // Reset form after successful confirmation
  if (isConfirmed && hash) {
    setTimeout(() => {
      setFormData({
        question: '',
        duration: 24,
        assetPriceId: PRICE_FEEDS.ETH_USD,
        targetPrice: '',
      });
      window.location.reload(); // Refresh to show new poll
    }, 2000);
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 mx-18">Create Prediction Poll</h2>
      
      {/* Success Message */}
      {isConfirmed && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800"> Poll created successfully!</p>
        </div>
      )}

      {/* Transaction Status */}
      {hash && !isConfirmed && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">⏳ Transaction pending...</p>
          <p className="text-xs font-mono">{hash}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-100 text-sm font-bold mb-2">
            Question *
          </label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({...formData, question: e.target.value})}
            className="w-full px-3 py-2 outline outline-1 outline-white rounded-lg focus:outline-1 focus:outline-[#ED3968]"
            placeholder="Will ETH reach $3000 by end of week?"
            required
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-100 text-sm font-bold mb-2">
            Asset *
          </label>
          <select
            value={formData.assetPriceId}
            onChange={(e) => setFormData({...formData, assetPriceId: e.target.value})}
            className="w-full px-3 py-2 outline outline-1 outline-white rounded-lg focus:outline-1 focus:outline-[#ED3968]"
            disabled={loading}
          >
            <option value={PRICE_FEEDS.ETH_USD}>ETH/USD</option>
            <option value={PRICE_FEEDS.BTC_USD}>BTC/USD</option>
            <option value={PRICE_FEEDS.SOL_USD}>SOL/USD</option>
            <option value={PRICE_FEEDS.HBAR_USD}>HBAR/USD</option>

          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-100 text-sm font-bold mb-2">
            Target Price (USD) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.targetPrice}
            onChange={(e) => setFormData({...formData, targetPrice: e.target.value})}
            className="w-full px-3 py-2 outline outline-1 outline-white rounded-lg focus:outline-1 focus:outline-[#ED3968]"
            placeholder="3000.00"
            required
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-100 text-sm font-bold mb-2">
            Duration (hours) *
          </label>
          <input
            type="number"
            min="1"
            max="168" // Max 1 week
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 1})}
            className="w-full px-3 py-2 outline outline-1 outline-white rounded-lg focus:outline-1 focus:outline-[#ED3968]"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-100 mt-1">
            Maximum: 168 hours (1 week)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || isConfirmed}
          className="w-full bg-[#ED3968]  font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Poll...' : 
           isConfirmed ? '✅ Poll Created!' :
           'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;