import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import Navbar from '@/components/Navbar';
import SuccessModal from '@/components/SuccessModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const contractAddress = "0x0E51e917f9B397CF654Ad009B2b60ae2d7525b46";
const contractABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "UsernameMinted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_wallet",
				"type": "address"
			}
		],
		"name": "checkUsernameFromRainbow",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_wallet",
				"type": "address"
			}
		],
		"name": "getUsernameFromWallet",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "isUsernameAvailable",
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
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "mintUsername",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "usernames",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "walletToUsername",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const MintUsername = () => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [existingUsername, setExistingUsername] = useState('');
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (isConnected && address && publicClient) {
      checkIfAlreadyMinted();
    }
  }, [isConnected, address, publicClient]);

  // Create provider that works with both injected wallets and WalletConnect
  const getProvider = async () => {
    // Try injected wallet first
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    
    // Fallback to wagmi publicClient
    if (publicClient) {
      const rpcUrl = publicClient.transport.url || publicClient.chain.rpcUrls.default.http[0];
      return new ethers.JsonRpcProvider(rpcUrl);
    }
    
    throw new Error('No provider available');
  };

  const checkIfAlreadyMinted = async () => {
    try {
      const provider = await getProvider();
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const existing = await contract.getUsernameFromWallet(address);
      if (existing && existing.length > 0) {
        setExistingUsername(existing);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  const mintUsername = async () => {
    if (!username) {
      setStatus('⚠️ Please enter a username.');
      return;
    }

    if (!isConnected || !address) {
      setStatus('Wallet not connected.');
      return;
    }

    if (!publicClient) {
      setStatus('Wallet connection not ready. Please try again.');
      return;
    }

    try {
      // First check if username is available (read-only operation)
      const provider = await getProvider();
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      const available = await contract.isUsernameAvailable(username);
      if (!available) {
        setStatus('Username is already taken. Please try another.');
        return;
      }

      setStatus('Minting username...');

      // For writing transactions, use different methods based on wallet type
      if (typeof window !== "undefined" && window.ethereum) {
        // Injected wallet (MetaMask extension)
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await browserProvider.getSigner();
          const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
          
          const tx = await contractWithSigner.mintUsername(username);
          await tx.wait();
          
          setStatus('✅ Username minted successfully!');
          setShowModal(true);
          return;
        } catch (error) {
          console.log('Injected wallet failed, trying WalletConnect:', error.message);
        }
      }

      // WalletConnect method
      if (walletClient) {
        try {
          const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'mintUsername',
            args: [username],
          });

          // Wait for transaction confirmation
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash });
          }

          setStatus('✅ Username minted successfully!');
          setShowModal(true);
        } catch (error) {
          console.error('WalletConnect transaction failed:', error);
          if (error.message.includes('rejected')) {
            setStatus('❌ Transaction cancelled by user.');
          } else {
            setStatus('❌ Error minting username.');
          }
        }
      } else {
        setStatus('❌ Wallet not properly connected.');
      }

    } catch (error) {
      console.error(error);
      setStatus('❌ Error minting username.');
    }
  };

  return (
    <>
      {!isConnected ? (
        <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Connect your wallet to continue</h1>
          <ConnectButton />
        </div>
      ) : (
        <>
          {showModal && (
            <SuccessModal
              onClose={() => setShowModal(false)}
              username={existingUsername || username}
            />
          )}

          <div className="flex justify-center items-center py-20 px-4">
            <div className="w-full max-w-md">
              <div className="text-white text-4xl md:text-6xl font-bold text-center">WELCOME TO</div>
              <p className="text-[#ED3968] text-4xl md:text-6xl font-bold text-center mt-2">SYNCIAL</p>

              <div className="text-rose-100 text-center text-sm md:text-md mt-4">
                Enter your preferred Username to create an account
              </div>

              <div className="flex justify-center py-4">
                <input
                  className="rounded-xl text-rose-100 px-4 py-2 bg-[#16030d] w-full text-lg outline outline-[#39071f]"
                  placeholder="Username"
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="text-rose-100 text-center text-sm mt-2">
                By signing up, you are agreeing to Syncial's
              </div>
              <p className="text-center text-[#ED3968] text-sm">Terms and Privacy Policy</p>

              <div className="flex justify-center py-4">
                <button
                  onClick={mintUsername}
                  disabled={!publicClient}
                  className="bg-[#ED3968] hover:bg-rose-400 rounded-2xl text-lg font-semibold transition w-full py-3 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Sign Up
                </button>
              </div>

              {status && (
                <div className="text-center text-white font-semibold py-2">
                  {status}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MintUsername;