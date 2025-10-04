import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import CreatePoll from '../components/PredictionMarket/CreatePoll';
import PollCard from '../components/PredictionMarket/PollCard';
import { usePollCount } from '../hooks/useContract';
import { usePyth } from '../hooks/usePyth';

const PredictionMarket = () => {
  const { isConnected } = useAccount();
  const { data: pollCount, isLoading: pollCountLoading } = usePollCount();
  const { prices, loading: pricesLoading, getFormattedPrice } = usePyth();
  const [activeTab, setActiveTab] = useState('polls');
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh polls when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'polls') {
      setRefreshKey(prev => prev + 1);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      
        <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Connect your wallet to continue</h1>
            <ConnectButton />
          </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-black shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Prediction Marketplace</h1>
              <p className="text-sm text-gray-500">
                {pollCountLoading ? 'Loading...' : `Total polls ${Number(pollCount) || 0} `}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="text-sm px-3 py-1 rounded transition-colors text-[#ED3968] bg-[#16030d] outline outline-2 outline-[#39071f] cursor-pointer"
                title="Refresh data"
              >
               Refresh
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Live Prices Section */}
        {!pricesLoading && (
          <div className=" bg-[#16030d] outline outline-2 outline-[#39071f] p-4 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-bold mb-3 text-[#ED3968] "> Live Prices</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-white">ETH/USD</p>
                <p className="font-bold text-lg text-[#ED3968] ">
                  ${getFormattedPrice('0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace') || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white">HBAR/USD</p>
                <p className="font-bold text-lg text-[#ED3968] ">
                  ${getFormattedPrice('0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd') || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white">BTC/USD</p>
                <p className="font-bold text-lg text-[#ED3968]">
                  ${getFormattedPrice('0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43') || 'N/A'}
                </p>
                 </div>
              
              {/* <div className="text-center">
                <p className="text-xs text-white">FIL/USD</p>
                <p className="font-bold text-lg text-[#ED3968] ">
                  ${getFormattedPrice('0x150ac9b959aee0051e4091f0ef5216d941f590e1c5e7f91cf7635b5c11628c0e') || 'N/A'}
                </p>
              </div> */}
              <div className="text-center">
                <p className="text-xs text-white">Last Updated</p>
                <p className="font-bold text-sm text-[#ED3968]">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleTabChange('polls')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'polls'
                ? 'bg-[#ED3968] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          >
           Total Polls {Number(pollCount) > 0 && `(${Number(pollCount)})`}
          </button>
          <button
            onClick={() => handleTabChange('create')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'create'
                ? 'bg-[#ED3968] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          >
            + Create Poll
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'polls' && (
          <div>
            {pollCountLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading polls...</p>
              </div>
            ) : Number(pollCount) === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 text-lg mb-4">No polls created yet</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Create the First Poll
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#ED3968] ">All Polls</h2>
                  <p className="text-sm text-gray-500">
                    Auto-refreshes every 30 seconds
                  </p>
                </div>
                
                {/* Poll List */}
                {Array.from({ length: Number(pollCount) }, (_, i) => (
                  <PollCard key={`${i}-${refreshKey}`} pollId={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className='py-12'>
            
            <CreatePoll />
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-3 text-gray-800"> How it Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold mb-2">1. Create or Find Polls</h4>
              <p>Browse active prediction markets or create your own with a specific price target and timeframe.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Place Your Bets</h4>
              <p>Bet YES if you think the price will reach the target, or NO if you think it won't. Minimum $1 USD.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Win Rewards</h4>
              <p>If you're correct, you win a share of the losing side's bets proportional to your contribution.</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> 3% fee applies (2% to poll creator, 1% to platform). 
              Minimum 4% volume required on each side for valid resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionMarket;