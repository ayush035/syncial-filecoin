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
            You shouldn't be here,This feature is being cooked at the moment.
          </h1>
          {/* <p className="text-gray-600">
            Manage your posts stored on 0G decentralized network
          </p> */}
        </div>
        </div>
        </div>
        )
    }