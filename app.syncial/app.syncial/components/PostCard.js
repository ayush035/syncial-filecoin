// components/PostCard.js - Uses server-side download API
import { useState, useEffect, useRef } from 'react';
import { User, Clock, Image as ImageIcon, MoreVertical, Trash2, Lock, Globe } from 'lucide-react';
import Username from './Username'

export default function PostCard({ post, showAuthor = true, isOwner = false, onDelete, onTogglePrivacy }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      onDelete(post.id);
      setShowMenu(false);
    }
  };

  const handleTogglePrivacy = () => {
    onTogglePrivacy(post.id, post.isPrivate);
    setShowMenu(false);
  };

  return (
    <div className="bg-[#16030d] outline outline-2 outline-[#39071f] rounded-lg shadow-md p-6 mb-6">
      {/* Header with author info and menu */}
      <div className="flex items-center justify-between mb-4">
        {showAuthor ? (
          <div className="flex items-center">
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
        ) : (
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-gray-400 text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(post.timestamp)}
            </div>
            {post.isPrivate && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-[#39071f] rounded-md">
                <Lock className="h-3 w-3 text-[#ED3968]" />
                <span className="text-xs text-[#ED3968] font-medium">Private</span>
              </div>
            )}
          </div>
        )}

        {/* Three-dot menu (only show for owner) */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#39071f] rounded-lg transition-colors"
              aria-label="Post options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border-2 border-[#39071f] rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleTogglePrivacy}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-[#16030d] transition-colors"
                >
                  {post.isPrivate ? (
                    <>
                      <Globe className="h-4 w-4 text-green-400" />
                      <span>Make Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-[#ED3968]" />
                      <span>Make Private</span>
                    </>
                  )}
                </button>
                
                <div className="border-t border-[#39071f]"></div>
                
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-400 hover:bg-[#16030d] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image container */}
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

      {/* Footer */}
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