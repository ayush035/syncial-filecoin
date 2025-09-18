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

  // Create a new post - updated to work with WalletConnect
  async createPost(imageRootHash) {
    // If we have window.ethereum (injected wallet), use the traditional method
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.createPost(imageRootHash);
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
        // Use wagmi's writeContract approach
        const hash = await this.walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'createPost',
          args: [imageRootHash],
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

  // Get posts of a user - this should work with read-only provider
  async getUserPosts(userAddress) {
    try {
      // For WalletConnect connections, we need to use the provider with the specific address
      const provider = await this._getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // If your contract has a method to get posts by address, use that
      // Otherwise, we'll need to call getMyPosts with a signer
      
      // First try: if contract has getUserPosts(address) method
      try {
        if (userAddress) {
          // Try calling a method that accepts address parameter (you may need to add this to your contract)
          const posts = await contract.getUserPosts(userAddress);
          return posts.map((post) => ({
            id: post.id.toString(),
            author: post.author,
            image: post.image,
            timestamp: new Date(Number(post.timestamp) * 1000),
            timestampUnix: Number(post.timestamp),
          }));
        }
      } catch (error) {
        console.log('getUserPosts(address) method not available, trying getMyPosts with signer');
      }
      
      // Second try: use signer for getMyPosts (this should work with WalletConnect)
      try {
        const signer = await this._getSigner();
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Call getMyPosts WITHOUT any argument
        const posts = await contractWithSigner.getMyPosts();
        
        // Map the posts
        return posts.map((post) => ({
          id: post.id.toString(),
          author: post.author,
          image: post.image,
          timestamp: new Date(Number(post.timestamp) * 1000),
          timestampUnix: Number(post.timestamp),
        }));
      } catch (signerError) {
        console.log('Signer method failed:', signerError.message);
        
        // Third try: Get all posts and filter by user address
        try {
          const allPosts = await contract.getAllPosts(); // You may need this method in your contract
          const userPosts = allPosts.filter(post => post.author.toLowerCase() === userAddress.toLowerCase());
          
          return userPosts.map((post) => ({
            id: post.id.toString(),
            author: post.author,
            image: post.image,
            timestamp: new Date(Number(post.timestamp) * 1000),
            timestampUnix: Number(post.timestamp),
          }));
        } catch (allPostsError) {
          console.log('getAllPosts method not available');
          throw new Error('Unable to fetch user posts with current connection method');
        }
      }
      
    } catch (error) {
      console.error('Error in getUserPosts:', error);
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