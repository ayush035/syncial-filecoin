// pages/feed.js
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { ethers } from "ethers";
import PostCard from "../components/PostCard";

// ✅ Contract details
const CONTRACT_ADDRESS = "0xA46B02adA701EB34Ad9AC8feB786F575208a4c46";

const abi = [
  {
    "inputs": [],
    "name": "getAllPosts",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "author", "type": "address" },
          { "internalType": "string", "name": "image", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct Post[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function FeedPage() {
  const publicClient = usePublicClient(); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);

      // ✅ publicClient gives us a transport
      const ethersProvider = new ethers.BrowserProvider(publicClient.transport);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, ethersProvider);

      const allPosts = await contract.getAllPosts();
      console.log("Raw posts:", allPosts);

      const formatted = allPosts.map((p) => ({
        id: Number(p.id),
        author: p.author,
        image: p.image,
        timestamp: Number(p.timestamp) * 1000,
      }));

      setPosts(formatted);
    } catch (err) {
      console.error("Error loading feed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Discover </h1>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-white">No posts yet.</p>
        ) : (
          posts.map((post, index) => <PostCard key={index} post={post} />)
        )}
      </div>
    </div>
  );
}
