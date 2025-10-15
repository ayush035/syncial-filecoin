// components/FollowListModal.jsx
import { X } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { USERNAME_CONTRACT } from '@/lib/username_congif';

function UserListItem({ address }) {
  const { data: username } = useReadContract({
    address: USERNAME_CONTRACT.address,
    abi: USERNAME_CONTRACT.abi,
    functionName: 'getUsernameFromWallet',
    args: [address],
    enabled: Boolean(address),
  });

  const displayName = username || 'Anonymous';
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between p-3 bg-[#16030d] outline outline-1 outline-[#39071f] rounded-lg hover:outline-2 transition-all">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">
          {displayName}
        </div>
        <div className="text-xs text-gray-400 font-mono truncate">
          {shortAddress}
        </div>
      </div>
    </div>
  );
}

export default function FollowListModal({ isOpen, onClose, title, addresses }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border-2 border-[#39071f] rounded-xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#39071f]">
          <h2 className="text-xl font-bold text-white">
            {title} ({addresses?.length || 0})
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#39071f]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {addresses && addresses.length > 0 ? (
            addresses.map((address, index) => (
              <UserListItem key={`${address}-${index}`} address={address} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {title === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}