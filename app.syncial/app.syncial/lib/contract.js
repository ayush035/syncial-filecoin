// lib/contract.js
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config.js";

class ContractService {
  constructor(publicClient, walletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  // Get provider - works with wagmi clients OR fallback to window.ethereum
  async _getProvider() {
    // If we have wagmi publicClient, create ethers provider from it
    if (this.publicClient) {
      // Create a provider using the same RPC URL as wagmi
      const rpcUrl = this.publicClient.transport.url || this.publicClient.chain.rpcUrls.default.http[0];
      return new ethers.JsonRpcProvider(rpcUrl);
    }
    
    // Fallback to window.ethereum for direct MetaMask connections
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    
    throw new Error(
      "No wallet provider found (MetaMask/Rainbow not detected)"
    );
  }

  // Get signer - works with wagmi walletClient OR fallback to provider
  async _getSigner() {
    // For WalletConnect connections, we need to use window.ethereum if available
    // or work with the wagmi wallet client directly
    
    // First try: Use window.ethereum if available (works with injected wallets)
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return signer;
      } catch (error) {
        console.log('window.ethereum signer failed:', error.message);
      }
    }
    
    // Second try: For WalletConnect, we need to use the provider but specify the account
    if (this.publicClient && this.walletClient) {
      try {
        // Get the RPC URL from publicClient
        const rpcUrl = this.publicClient.transport.url || this.publicClient.chain.rpcUrls.default.http[0];
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // For WalletConnect, we can't get a signer directly
        // We need to use the wallet client to sign transactions
        // This is a limitation - we'll need to handle this differently
        throw new Error('WalletConnect transactions require special handling');
      } catch (error) {
        console.log('WalletConnect signer attempt failed:', error.message);
      }
    }
    
    // Final fallback
    throw new Error('Unable to get signer - please ensure wallet is properly connected');
  }

  // Create a new post - updated to work with WalletConnect and privacy parameter
  async createPost(imageRootHash, isPrivate = false) {
    console.log('Creating post with privacy:', isPrivate); // Debug log
    
    // If we have window.ethereum (injected wallet), use the traditional method
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Pass both parameters to createPost
        const tx = await contract.createPost(imageRootHash, isPrivate);
        const receipt = await tx.wait();
        
        return {
          hash: tx.hash,
          receipt,
          success: receipt.status === 1,
        };
      } catch (error) {
        console.log('Injected wallet transaction failed:', error.message);
        // Continue to WalletConnect method below
      }
    }
    
    // For WalletConnect, we need to use wagmi's approach
    if (this.walletClient) {
      try {
        // Use wagmi's writeContract approach with privacy parameter
        const hash = await this.walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'createPost',
          args: [imageRootHash, isPrivate], // Pass both parameters
        });
        
        // Wait for transaction receipt
        if (this.publicClient) {
          const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
          return {
            hash: hash,
            receipt,
            success: receipt.status === 'success',
          };
        }
        
        // If no publicClient, return just the hash
        return {
          hash: hash,
          receipt: null,
          success: true, // Assume success if we got a hash
        };
        
      } catch (error) {
        console.error('WalletConnect transaction failed:', error);
        throw error;
      }
    }
    
    throw new Error('No suitable wallet connection method available');
  }

  // Delete a post
  async deletePost(postId) {
    console.log('Deleting post:', postId);
    
    // If we have window.ethereum (injected wallet)
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        const tx = await contract.deletePost(postId);
        const receipt = await tx.wait();
        
        return {
          hash: tx.hash,
          receipt,
          success: receipt.status === 1,
        };
      } catch (error) {
        console.log('Injected wallet transaction failed:', error.message);
      }
    }
    
    // For WalletConnect
    if (this.walletClient) {
      try {
        const hash = await this.walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'deletePost',
          args: [postId],
        });
        
        if (this.publicClient) {
          const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
          return {
            hash: hash,
            receipt,
            success: receipt.status === 'success',
          };
        }
        
        return {
          hash: hash,
          receipt: null,
          success: true,
        };
        
      } catch (error) {
        console.error('Delete post transaction failed:', error);
        throw error;
      }
    }
    
    throw new Error('No suitable wallet connection method available');
  }

  // Set post privacy
  async setPostPrivacy(postId, isPrivate) {
    console.log('Setting post privacy:', postId, isPrivate);
    
    // If we have window.ethereum (injected wallet)
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        const tx = await contract.setPostPrivacy(postId, isPrivate);
        const receipt = await tx.wait();
        
        return {
          hash: tx.hash,
          receipt,
          success: receipt.status === 1,
        };
      } catch (error) {
        console.log('Injected wallet transaction failed:', error.message);
      }
    }
    
    // For WalletConnect
    if (this.walletClient) {
      try {
        const hash = await this.walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'setPostPrivacy',
          args: [postId, isPrivate],
        });
        
        if (this.publicClient) {
          const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
          return {
            hash: hash,
            receipt,
            success: receipt.status === 'success',
          };
        }
        
        return {
          hash: hash,
          receipt: null,
          success: true,
        };
        
      } catch (error) {
        console.error('Set privacy transaction failed:', error);
        throw error;
      }
    }
    
    throw new Error('No suitable wallet connection method available');
  }

  // Get posts of a user - this should work with read-only provider
// Get posts of a user - FIXED to always get user's posts including private ones
// Get posts of a user - IMPROVED to reliably detect own posts
async getUserPosts(userAddress) {
  try {
    console.log('🔍 getUserPosts called for:', userAddress);
    
    // Get the current connected address from multiple sources
    let currentAddress = null;
    
    // Try 1: From walletClient
    if (this.walletClient?.account?.address) {
      currentAddress = this.walletClient.account.address;
      console.log('✅ Got address from walletClient:', currentAddress);
    }
    
    // Try 2: From wagmi hook (passed in)
    if (!currentAddress && typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          currentAddress = accounts[0];
          console.log('✅ Got address from window.ethereum:', currentAddress);
        }
      } catch (error) {
        console.log('Could not get address from window.ethereum');
      }
    }
    
    console.log('Current address:', currentAddress);
    console.log('Requested address:', userAddress);
    console.log('Are they same?', currentAddress?.toLowerCase() === userAddress?.toLowerCase());
    
    // If we're getting posts for the connected user, use getMyPosts
    if (currentAddress && userAddress.toLowerCase() === currentAddress.toLowerCase()) {
      console.log('✅ Fetching OWN posts using getMyPosts()');
      
      try {
        // Use window.ethereum signer to call getMyPosts
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          
          const posts = await contractWithSigner.getMyPosts();
          console.log('📦 Raw posts from getMyPosts:', posts);
          console.log('📊 Number of posts:', posts.length);
          
          const formattedPosts = posts.map((post) => {
            console.log('Post details:', {
              id: post.id.toString(),
              isPrivate: post.isPrivate,
              isDeleted: post.isDeleted
            });
            
            return {
              id: post.id.toString(),
              author: post.author,
              image: post.image,
              timestamp: new Date(Number(post.timestamp) * 1000),
              timestampUnix: Number(post.timestamp),
              isPrivate: post.isPrivate,
              isDeleted: post.isDeleted,
            };
          });
          
          console.log('✅ Formatted posts from getMyPosts:', formattedPosts.length);
          return formattedPosts;
        }
      } catch (error) {
        console.error('❌ getMyPosts failed:', error);
        throw error; // Don't fall back for own posts
      }
    }
    
    // For other users' posts, use getUserPosts(address) - respects privacy
    console.log('📝 Fetching posts for ANOTHER user using getUserPosts(address)');
    
    const provider = await this._getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    try {
      const posts = await contract.getUserPosts(userAddress);
      console.log('📦 Raw posts from getUserPosts:', posts);
      
      return posts.map((post) => ({
        id: post.id.toString(),
        author: post.author,
        image: post.image,
        timestamp: new Date(Number(post.timestamp) * 1000),
        timestampUnix: Number(post.timestamp),
        isPrivate: post.isPrivate || false,
        isDeleted: post.isDeleted || false,
      }));
    } catch (error) {
      console.error('❌ getUserPosts(address) failed:', error);
      throw new Error('Unable to fetch user posts');
    }
    
  } catch (error) {
    console.error('❌ Error in getUserPosts:', error);
    throw error;
  }
}
  // Get total posts
  async getTotalPosts() {
    const provider = await this._getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const total = await contract.totalPosts();
    return Number(total);
  }
}

// Factory to get instance safely in browser
export function getContractService(publicClient = null, walletClient = null) {
  if (typeof window === "undefined") {
    throw new Error("ContractService can only be used in the browser");
  }
  return new ContractService(publicClient, walletClient);
}