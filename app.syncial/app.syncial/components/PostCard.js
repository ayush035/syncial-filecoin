// components/PostCard.js - Uses server-side download API
import { useState, useEffect } from 'react';
import { User, Clock, Image as ImageIcon } from 'lucide-react';

export default function PostCard({ post, showAuthor = true }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadImage = async () => {
    if (!post.pieceCid) {
      setError('No image PieceCID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading image via server API:', post.pieceCid);
     const imageUrl = `/api/download/${post.pieceCid}`;
      
      // Pre-load to check if it works
      const img = new Image();
      img.onload = () => {
        setImageUrl(imageUrl);
        setLoading(false);
      };
      img.onerror = () => {
        setError('Failed to load image from Filecoin');
        setLoading(false);
      };
      img.src = imageUrl;
      
    } catch (err) {
      console.error('Error loading image:', err);
      setError('Failed to load image');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImage();
  }, [post.image]);

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    loadImage();
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-md p-6 mb-6">
      {showAuthor && (
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ED3968] to-rose-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-white font-medium">{truncateAddress(post.author)}</p>
            <div className="flex items-center text-gray-400 text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(post.timestamp)}
            </div>
          </div>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden bg-gray-900 min-h-[300px] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED3968]"></div>
            <p className="text-gray-400 text-sm">Loading from Filecoin...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <ImageIcon className="h-12 w-12" />
            <p className="text-sm text-center">{error}</p>
            <button
              onClick={retryLoad}
              className="text-xs text-[#ED3968] hover:text-rose-400 underline"
            >
              Try again
            </button>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Post content"
            className="w-full h-auto max-h-[600px] object-contain"
            onError={retryLoad}
          />
        ) : (
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <ImageIcon className="h-12 w-12" />
            <p className="text-sm">No image available</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Post #{post.id}</span>
          <span className="text-gray-400">Stored on Filecoin</span>
        </div>
        {!showAuthor && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDate(post.timestamp)}
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-600 break-all font-mono">
        PieceCID: {post.pieceCid}
      </div>
    </div>
  );
}