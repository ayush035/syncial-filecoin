import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { RefreshCw, TrendingUp, Calendar, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import PostCard from '../components/PostCard';
import { getContractService } from '../lib/contract';
import toast from 'react-hot-toast';
import Username from '@/components/Username'
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Dashboard() {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalPosts: 0, totalGlobal: 0 });
  const [contractService, setContractService] = useState(null);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Initialize contractService using wagmi providers instead of window.ethereum
  useEffect(() => {
    if (isConnected && address && publicClient) {
      try {
        // Only try to initialize if we have window.ethereum OR if we can create a service with wagmi
        if (typeof window !== "undefined" && (window.ethereum || publicClient)) {
          const service = getContractService(publicClient, walletClient);
          setContractService(service);
        }
      } catch (error) {
        console.error('Contract service initialization failed:', error.message);
        // Don't set contractService if it fails - this prevents the loadUserPosts from running
        setContractService(null);
      }
    } else {
      setContractService(null);
    }
  }, [isConnected, address, publicClient, walletClient]);

  const loadUserPosts = async () => {
    // Don't try to load posts if no contract service available
    if (!isConnected || !address || !contractService) {
      console.log('Skipping post loading - missing requirements:', { 
        isConnected, 
        address: !!address, 
        contractService: !!contractService 
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Loading posts for address:', address);
      // Pass the user address to getUserPosts
      const posts = await contractService.getUserPosts(address);
      console.log('Loaded user posts:', posts);
      
      const sortedPosts = posts.sort((a, b) => b.timestampUnix - a.timestampUnix);
      setUserPosts(sortedPosts);

      const totalGlobal = await contractService.getTotalPosts();
      setStats({
        totalPosts: posts.length,
        totalGlobal
      });

    } catch (error) {
      console.error('Error loading posts:', error);
      // Show a more helpful error message
      if (error.message.includes('Unable to fetch user posts')) {
        toast.error('Unable to load posts with current connection. Try refreshing or reconnecting your wallet.');
      } else if (!error.message.includes('wallet provider') && !error.message.includes('MetaMask')) {
        toast.error('Failed to load your posts');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPosts();
  }, [contractService]);

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    toast.success('Post created! It may take a moment to appear.');
    setTimeout(() => {
      loadUserPosts();
    }, 2000);
  };

  const handleRefresh = () => {
    loadUserPosts();
    toast.success('Posts refreshed!');
  };

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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <Username/>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Dashboard
          </h1>
          {/* <p className="text-gray-600">
            Manage your posts stored on 0G decentralized network
          </p> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-sm p-4 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">My Posts</p>
                <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
              </div>
              <Calendar className="h-8 w-8 text-pink-200" />
            </div>
          </div>
          <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-sm p-4 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Global Posts</p>
                <p className="text-2xl font-bold text-white">{stats.totalGlobal}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-pink-200" />
            </div>
          </div>
        </div>
        
        {/* Upload Component */}
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
        
        {/* Posts Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              My Posts ({userPosts.length})
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading || !contractService}
              className="flex items-center space-x-2 text-[#ED3968] hover:text-rose-100 hover:cursor-pointer text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
          
          {loading && userPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your posts from the blockchain...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">
                Share your first image to get started!
              </p>
              <div className="text-sm text-gray-500">
                Your images will be stored permanently on the 0G decentralized network
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <PostCard 
                  key={`${post.id}-${post.timestampUnix}`} 
                  post={post} 
                  showAuthor={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}