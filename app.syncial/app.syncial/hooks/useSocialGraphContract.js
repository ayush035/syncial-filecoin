// hooks/useSocialGraphContract.js
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';

const SOCIAL_GRAPH_CONTRACT_ADDRESS = '0x9A85208bD9D5B20E95F4EBBfce6567D64f38DFD4'; // Replace this

// You need to provide your social graph contract ABI
// It should have functions like: follow(address), unfollow(address), isFollowing(address, address), getFollowers(address), getFollowing(address)
const SOCIAL_GRAPH_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_usernamesContract",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "follower",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "following",
				"type": "address"
			}
		],
		"name": "Followed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "follower",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "following",
				"type": "address"
			}
		],
		"name": "Unfollowed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			}
		],
		"name": "follow",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "followByUsername",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getFollowers",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getFollowing",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
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
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isFollowing",
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
				"internalType": "address",
				"name": "follower",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			}
		],
		"name": "isUserFollowing",
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
				"internalType": "address",
				"name": "target",
				"type": "address"
			}
		],
		"name": "unfollow",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "unfollowByUsername",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "usernamesContract",
		"outputs": [
			{
				"internalType": "contract IUsernames",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export const useSocialGraphContract = () => {
  const { writeContract } = useWriteContract();
  const [txHash, setTxHash] = useState(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const followUser = async (addressToFollow) => {
    try {
      const hash = await writeContract({
        address: SOCIAL_GRAPH_CONTRACT_ADDRESS,
        abi: SOCIAL_GRAPH_ABI,
        functionName: 'follow',
        args: [addressToFollow],
      });
      setTxHash(hash);
      return hash;
    } catch (error) {
      console.error('Follow error:', error);
      throw error;
    }
  };

  const unfollowUser = async (addressToUnfollow) => {
    try {
      const hash = await writeContract({
        address: SOCIAL_GRAPH_CONTRACT_ADDRESS,
        abi: SOCIAL_GRAPH_ABI,
        functionName: 'unfollow',
        args: [addressToUnfollow],
      });
      setTxHash(hash);
      return hash;
    } catch (error) {
      console.error('Unfollow error:', error);
      throw error;
    }
  };

  return {
    followUser,
    unfollowUser,
    isConfirming,
    isConfirmed,
    txHash,
    contractAddress: SOCIAL_GRAPH_CONTRACT_ADDRESS,
    abi: SOCIAL_GRAPH_ABI
  };
};

// Hook to check if following
export const useIsFollowing = (followerAddress, followeeAddress) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: SOCIAL_GRAPH_CONTRACT_ADDRESS,
    abi: SOCIAL_GRAPH_ABI,
    functionName: 'isFollowing',
    args: [followerAddress, followeeAddress],
    enabled: !!followerAddress && !!followeeAddress,
  });

  return {
    isFollowing: data || false,
    isError,
    isLoading,
    refetch
  };
};