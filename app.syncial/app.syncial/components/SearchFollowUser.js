// components/UsernameSearch.jsx
import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useUsernameContract } from '../hooks/useUsernameContract';
import { useSocialGraphContract, useIsFollowing } from '../hooks/useSocialGraphContract';

export default function UsernameSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef(null);
  
  const { address: currentUserAddress, isConnected } = useAccount();
  const { contractAddress: usernameContractAddress, abi: usernameAbi } = useUsernameContract();
  const { followUser, unfollowUser, isConfirming, isConfirmed, isPending, error: txError } = useSocialGraphContract();

  // Get wallet from username
  const { data: walletAddress, refetch: refetchWallet, isLoading: isSearching } = useReadContract({
    address: usernameContractAddress,
    abi: usernameAbi,
    functionName: 'usernames',
    args: [searchQuery],
    enabled: false, // Manual trigger
  });

  // Get username from wallet (to verify)
  const { data: verifiedUsername, refetch: refetchUsername } = useReadContract({
    address: usernameContractAddress,
    abi: usernameAbi,
    functionName: 'getUsernameFromWallet',
    args: [walletAddress],
    enabled: false,
  });

  // Check if current user is following the searched user
  const { isFollowing, refetch: refetchFollowStatus, isLoading: isCheckingFollowStatus } = useIsFollowing(
    currentUserAddress,
    searchResult?.address
  );

  // Close dropdown when clicking outside - BUT NOT when clicking inside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refetch follow status when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchFollowStatus();
      setErrorMsg('');
    }
  }, [isConfirmed, refetchFollowStatus]);

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      console.error('Transaction error:', txError);
      setErrorMsg(txError.message || 'Transaction failed');
    }
  }, [txError]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    setShowDropdown(true);
    setErrorMsg('');

    try {
      // Get wallet from username
      const { data: wallet } = await refetchWallet();
      
      console.log('Search result wallet:', wallet); // Debug

      if (wallet && wallet !== '0x0000000000000000000000000000000000000000') {
        // Verify username
        const { data: username } = await refetchUsername();
        
        console.log('Verified username:', username); // Debug

        setSearchResult({
          username: username || searchQuery,
          address: wallet,
          isCurrentUser: wallet.toLowerCase() === currentUserAddress?.toLowerCase()
        });

        // Refetch follow status
        if (currentUserAddress) {
          await refetchFollowStatus();
        }
      } else {
        setSearchResult({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({ error: 'Error searching for user' });
    }
  };

  const handleFollowToggle = async (e) => {
    // CRITICAL: Stop event from bubbling up
    e.stopPropagation();
    e.preventDefault();
    
    // Debug logs - These MUST appear if button is clicked
    console.log('🔴 FOLLOW BUTTON CLICKED!');
    console.log('Current user:', currentUserAddress);
    console.log('Target user:', searchResult?.address);
    console.log('Is connected:', isConnected);
    console.log('Is following:', isFollowing);

    // Check wallet connection
    if (!isConnected) {
      alert('Please connect your wallet first');
      setErrorMsg('Please connect your wallet first');
      return;
    }

    // Validate search result
    if (!searchResult || searchResult.error || searchResult.isCurrentUser) {
      console.log('❌ Invalid operation');
      return;
    }

    setErrorMsg('');

    try {
      if (isFollowing) {
        console.log('🔵 Calling unfollowUser...');
        await unfollowUser(searchResult.address);
      } else {
        console.log('🟢 Calling followUser...');
        await followUser(searchResult.address);
      }
    } catch (error) {
      console.error('Follow/Unfollow error:', error);
      
      // Better error messages
      if (error.message?.includes('user rejected')) {
        setErrorMsg('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        setErrorMsg('Insufficient funds for gas fee');
      } else {
        setErrorMsg(error.shortMessage || error.message || 'Transaction failed. Please try again.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => searchResult && setShowDropdown(true)}
          placeholder="Search"
          className="px-4 py-2 outline outline-1 outline-[#39071f] rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 w-64 text-rose-100 bg-[#16030d] text-lg w-full h-full"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 bg-[#ED3968] text-white rounded-lg hover:bg-rose-400 cursor-pointer disabled:bg-rose-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && searchResult && (
        <div 
          className="absolute top-full mt-2 left-0 bg-[#16030d] text-white  rounded-lg shadow-xl z-[9999] min-w-[450px]"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {searchResult.error ? (
            <div className="p-4 text-red-600 text-center">
              {searchResult.error}
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-lg">
                    {searchResult.username}
                  </div>
                  <div className="text-xs text-rose-200 font-mono truncate mt-1">
                    {searchResult.address}
                  </div>
                  {searchResult.isCurrentUser && (
                    <span className="text-xs text-white mt-2 inline-block font-medium">
                      (You)
                    </span>
                  )}
                </div>
                
                {!searchResult.isCurrentUser && (
                  <button
                    onClick={handleFollowToggle}
                    onMouseDown={(e) => {
                      console.log('🟡 Button mousedown event fired'); // Additional test
                    }}
                    disabled={isPending || isConfirming || !isConnected}
                    className={`
                      flex-shrink-0 px-6 py-2.5 rounded-lg font-medium 
                      transition-all duration-200 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isFollowing
                        ? 'bg-[#ED3968] text-gray-800 hover:bg-rose-400 active:bg-[#ED3968]'
                        : 'bg-[#ED3968] text-white hover:bg-rose-400 active:bg-[#ED3968]'
                      }
                    `}
                    style={{ pointerEvents: 'auto' }} // Force button to be clickable
                    type="button" // Explicit button type
                  >
                    {isPending ? '⏳ Confirming...' : 
                     isConfirming ? '⏳ Processing...' : 
                     isCheckingFollowStatus ? '⏳ Loading...' :
                     isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Status Messages */}
              {isPending && (
                <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  ⏳ Please confirm the transaction in your wallet...
                </div>
              )}
              
              {isConfirming && (
                <div className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  ⏳ Transaction confirming on blockchain...
                </div>
              )}
              
              {isConfirmed && (
                <div className="mt-3 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  ✅ Transaction confirmed successfully!
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  ❌ {errorMsg}
                </div>
              )}

              {/* Wallet Connection Warning */}
              {!isConnected && !searchResult.isCurrentUser && (
                <div className="mt-3 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  ⚠️ Please connect your wallet to follow users
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}