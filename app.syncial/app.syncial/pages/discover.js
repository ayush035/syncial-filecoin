// pages/feed.js or pages/discover.js
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { ethers } from "ethers";
import PostCard from "../components/PostCard";
// Contract details - Update to use PieceCID instead of rootHash
const CONTRACT_ADDRESS = "0x4b5548Dc9B2c50FA419B3A35789837f96A7dD7B1";

const abi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "image",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isPrivate",
				"type": "bool"
			}
		],
		"name": "createPost",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "postId",
				"type": "uint256"
			}
		],
		"name": "deletePost",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "image",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isPrivate",
				"type": "bool"
			}
		],
		"name": "PostCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "author",
				"type": "address"
			}
		],
		"name": "PostDeleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isPrivate",
				"type": "bool"
			}
		],
		"name": "PostPrivacyChanged",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "postId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPrivate",
				"type": "bool"
			}
		],
		"name": "setPostPrivacy",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllPosts",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "author",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "image",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPrivate",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isDeleted",
						"type": "bool"
					}
				],
				"internalType": "struct SocialPosts.Post[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "offset",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "count",
				"type": "uint256"
			}
		],
		"name": "getFeed",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "author",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "image",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPrivate",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isDeleted",
						"type": "bool"
					}
				],
				"internalType": "struct SocialPosts.Post[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMyPosts",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "author",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "image",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPrivate",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isDeleted",
						"type": "bool"
					}
				],
				"internalType": "struct SocialPosts.Post[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "postId",
				"type": "uint256"
			}
		],
		"name": "getPost",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "author",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "image",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPrivate",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isDeleted",
						"type": "bool"
					}
				],
				"internalType": "struct SocialPosts.Post",
				"name": "",
				"type": "tuple"
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
		"name": "getUserPosts",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "author",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "image",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPrivate",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isDeleted",
						"type": "bool"
					}
				],
				"internalType": "struct SocialPosts.Post[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "postId",
				"type": "uint256"
			}
		],
		"name": "isPostDeleted",
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
				"internalType": "uint256",
				"name": "postId",
				"type": "uint256"
			}
		],
		"name": "isPostPrivate",
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
		"inputs": [],
		"name": "totalPosts",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
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
		"name": "totalUserPosts",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export default function FeedPage() {
  const publicClient = usePublicClient();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPosts, setTotalPosts] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage] = useState(10);

  useEffect(() => {
    loadFeed();
  }, [currentPage]);

  const loadFeed = async (usePagination = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Create ethers provider from wagmi publicClient
      const ethersProvider = new ethers.BrowserProvider(publicClient.transport);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, ethersProvider);

      let allPosts;
      let total;

      if (usePagination) {
        // Use paginated feed (newest first)
        const offset = currentPage * postsPerPage;
        allPosts = await contract.getFeed(offset, postsPerPage);
        total = await contract.totalPosts();
        setTotalPosts(Number(total));
      } else {
        // Load all posts (for smaller feeds)
        allPosts = await contract.getAllPosts();
        total = allPosts.length;
        setTotalPosts(total);
        
        // Sort by timestamp descending (newest first)
        allPosts = [...allPosts].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      }

      console.log("Raw posts from contract:", allPosts);

      // Format posts - image field now contains PieceCID
      const formatted = allPosts.map((p) => ({
        id: Number(p.id),
        author: p.author,
        pieceCid: p.image,   // 👈 rename so PostCard can use it
        timestamp: Number(p.timestamp) * 1000,
        timestampUnix: Number(p.timestamp)
      }));

      console.log("Formatted posts with PieceCIDs:", formatted);
      setPosts(formatted);

    } catch (err) {
      console.error("Error loading feed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(0);
    loadFeed();
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * postsPerPage < totalPosts) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Discover Posts</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-[#ED3968] text-white rounded-lg hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg p-4 mb-6">
          <p className="text-white">
            Total Posts: <span className="font-bold">{totalPosts}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Stored on Filecoin's decentralized network
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">Error: {error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED3968] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading posts from blockchain...</p>
          </div>
        ) : (
          <>
            {/* Posts */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white text-lg mb-2">No posts found</p>
                  <p className="text-gray-400">
                    Be the first to share something on Filecoin!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={`${post.id}-${post.timestampUnix}`} 
                    post={post} 
                    showAuthor={true}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPosts > postsPerPage && (
              <div className="flex justify-between items-center mt-8 p-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-[#16030d] outline outline-2 outline-[#39071f] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#39071f]"
                >
                  Previous
                </button>
                
                <span className="text-white">
                  Page {currentPage + 1} of {Math.ceil(totalPosts / postsPerPage)}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={(currentPage + 1) * postsPerPage >= totalPosts}
                  className="px-4 py-2 bg-[#16030d] outline outline-2 outline-[#39071f] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#39071f]"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}