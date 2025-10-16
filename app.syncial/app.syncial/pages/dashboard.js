import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { RefreshCw, TrendingUp, Calendar, Image as ImageIcon, Users, UserPlus } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import PostCard from '../components/PostCard';
import { getContractService } from '../lib/contract';
import toast from 'react-hot-toast';
import Username from '@/components/Username'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract } from 'wagmi';
import { SOCIAL_GRAPH_CONTRACT } from '@/lib/config3';
import FollowListModal from '../components/FollowListModal';

export default function Dashboard() {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalPosts: 0, totalGlobal: 0 });
  const [contractService, setContractService] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Get followers array
  const { data: followersArray } = useReadContract({
    address: SOCIAL_GRAPH_CONTRACT.address,
    abi: SOCIAL_GRAPH_CONTRACT.abi,
    functionName: 'getFollowers',
    args: [address],
    enabled: Boolean(address),
  });

  // Get following array
  const { data: followingArray } = useReadContract({
    address: SOCIAL_GRAPH_CONTRACT.address,
    abi: SOCIAL_GRAPH_CONTRACT.abi,
    functionName: 'getFollowing',
    args: [address],
    enabled: Boolean(address),
  });

  // Calculate counts from arrays
  const followerCount = followersArray?.length || 0;
  const followingCount = followingArray?.length || 0;

  // Initialize contractService using wagmi providers
  useEffect(() => {
    if (isConnected && address && publicClient) {
      try {
        if (typeof window !== "undefined" && (window.ethereum || publicClient)) {
          const service = getContractService(publicClient, walletClient);
          setContractService(service);
        }
      } catch (error) {
        console.error('Contract service initialization failed:', error.message);
        setContractService(null);
      }
    } else {
      setContractService(null);
    }
  }, [isConnected, address, publicClient, walletClient]);

  const loadUserPosts = async () => {
    if (!isConnected || !address || !contractService) {
      console.log('Skipping post loading - missing requirements:', { 
        isConnected, 
        address: !!address, 
        contractService: !!contractService 
      });
      return;
    }
  
    // Prevent double-loading
    if (loading) {
      console.log('⏸️ Already loading, skipping...');
      return;
    }
  
    setLoading(true);
    try {
      console.log('🔍 Loading posts for address:', address);
      const posts = await contractService.getUserPosts(address);
      console.log('📦 Loaded user posts:', posts);
      console.log('📊 Post count:', posts.length);
      
      // Debug each post
      posts.forEach((post, i) => {
        console.log(`Post ${i + 1}:`, {
          id: post.id,
          isPrivate: post.isPrivate,
          isDeleted: post.isDeleted
        });
      });
      
      // Format posts for Synapse - image field contains PieceCID
      const formattedPosts = posts.map(post => ({
        ...post,
        pieceCid: post.image, // normalize name
        timestamp: post.timestampUnix * 1000
      }));
      
      const sortedPosts = formattedPosts.sort((a, b) => b.timestampUnix - a.timestampUnix);
      
      console.log('✅ Setting posts in state:', sortedPosts.length);
      setUserPosts(sortedPosts);
  
      const totalGlobal = await contractService.getTotalPosts();
      setStats({
        totalPosts: posts.length,
        totalGlobal
      });
  
    } catch (error) {
      console.error('❌ Error loading posts:', error);
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
    toast.success('Post created! Your image is now stored on Filecoin.');
    
      // Always extract CID safely
      const cid = typeof result === 'string' ? result : result.pieceCid;
    
      setUserPosts(prev => [
        {
          id: Date.now(), // temporary ID
          pieceCid: cid,
          author: address,
          timestamp: Date.now(),
          timestampUnix: Math.floor(Date.now() / 1000),
        },
        ...prev,
      ]);
    
      // Refresh after a short delay
      setTimeout(() => loadUserPosts(), 2000);
      };

  const handleRefresh = () => {
    loadUserPosts();
    toast.success('Posts refreshed!');
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!contractService) {
      toast.error('Contract service not initialized');
      return;
    }

    const loadingToast = toast.loading('Deleting post...');
    
    try {
      const result = await contractService.deletePost(postId);
      
      if (result.success) {
        toast.success('Post deleted successfully!', { id: loadingToast });
        
        // Remove post from UI
        setUserPosts(prev => prev.filter(post => post.id !== postId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalPosts: prev.totalPosts - 1
        }));
      } else {
        throw new Error('Delete transaction failed');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      
      let errorMessage = 'Failed to delete post';
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  // Handle privacy toggle
  const handleTogglePrivacy = async (postId, currentPrivacy) => {
    if (!contractService) {
      toast.error('Contract service not initialized');
      return;
    }

    const newPrivacy = !currentPrivacy;
    const loadingToast = toast.loading(`Making post ${newPrivacy ? 'private' : 'public'}...`);
    
    try {
      const result = await contractService.setPostPrivacy(postId, newPrivacy);
      
      if (result.success) {
        toast.success(`Post is now ${newPrivacy ? 'private' : 'public'}!`, { id: loadingToast });
        
        // Update post in UI
        setUserPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, isPrivate: newPrivacy }
            : post
        ));
      } else {
        throw new Error('Privacy update transaction failed');
      }
    } catch (error) {
      console.error('Toggle privacy error:', error);
      
      let errorMessage = 'Failed to update privacy';
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
    }
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
          <p className="text-gray-400">
            Manage your posts stored on Filecoin's decentralized network
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">My Posts</p>
                <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
              </div>
              <Calendar className="h-8 w-8 text-pink-200" />
            </div>
          </div>
          <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Global Posts</p>
                <p className="text-2xl font-bold text-white">{stats.totalGlobal}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-pink-200" />
            </div>
          </div>
          <button
            onClick={() => setShowFollowersModal(true)}
            className="bg-[#16030d] outline outline-2 outline-[#39071f] hover:outline-[#ED3968] rounded-lg shadow-sm p-4 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Followers</p>
                <p className="text-2xl font-bold text-white">{followerCount}</p>
              </div>
              <Users className="h-8 w-8 text-pink-200" />
            </div>
          </button>
          <button
            onClick={() => setShowFollowingModal(true)}
            className="bg-[#16030d] outline outline-2 outline-[#39071f] hover:outline-[#ED3968] rounded-lg shadow-sm p-4 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Following</p>
                <p className="text-2xl font-bold text-white">{followingCount}</p>
              </div>
              <UserPlus className="h-8 w-8 text-pink-200" />
            </div>
          </button>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED3968] mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your posts from the blockchain...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No posts yet</h3>
              <p className="text-gray-400 mb-6">
                Share your first image to get started!
              </p>
              <div className="text-sm text-gray-500">
                Your images will be stored permanently on Filecoin's decentralized network
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <PostCard 
                  key={`${post.id}-${post.timestampUnix}`} 
                  post={post} 
                  showAuthor={false}
                  isOwner={true}
                  onDelete={handleDeletePost}
                  onTogglePrivacy={handleTogglePrivacy}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FollowListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Followers"
        addresses={followersArray}
      />
      <FollowListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Following"
        addresses={followingArray}
      />
    </div>
  );
}