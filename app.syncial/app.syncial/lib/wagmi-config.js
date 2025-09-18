// wagmi-config.js
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, /* your chain */ } from 'wagmi/chains';


const Oggalileo = {
    id: 16601,
    name: '0G-Galileo-Testnet',
  
    iconBackground: '#fff',
    nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://evmrpc-testnet.0g.ai	'] },
    },
    blockExplorers: {
      default: { name: '0g Galileo explorer', url: 'https://chainscan-galileo.0g.ai' },
    },
    // contracts: {
    //   multicall3: {
    //     address: '0xca11bde05977b3631167028862be2a173976ca11',
    //     blockCreated: 11907934,
    //   },
    }

export const config = createConfig({
  appName: 'Syncial',
  projectId: 'e789aa4ef8fbaccc12ac0cca7d97b01d',
  chains: [Oggalileo], // Add your specific chains
  transports: {
    [Oggalileo.id]: http()
    // Add transports for your chains
  },
});