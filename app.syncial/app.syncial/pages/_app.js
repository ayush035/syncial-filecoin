import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
// import Footer from '../components/Footer';
import { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, http } from 'wagmi'
import { metis, sepolia } from 'wagmi/chains'
import { getDefaultConfig, } from '@rainbow-me/rainbowkit'
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

const Oggalileo = {
  id: 16601,
  name: '0G Galileo Testnet',

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
 
 const config = getDefaultConfig({
  appName: 'Syncial',
  projectId: 'e789aa4ef8fbaccc12ac0cca7d97b01d',
  chains: [Oggalileo],
  transports: {
    [Oggalileo.id]: http(),
  }
}) 


const queryClient = new QueryClient()

function MyApp({ Component, pageProps }) {
  return (
<WagmiProvider config={config}>
<QueryClientProvider  client={queryClient}>
        <RainbowKitProvider 
        initialChain={4}
        theme={darkTheme({
          accentColor: '#ED3968',
          accentColorForeground: 'whites',
          borderRadius: 'medium',
          modalBorder: '#F33A6A'

        })}
        
      >
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
          <Navbar/>
            <Component {...pageProps} />
            <Analytics />
            <SpeedInsights />
          </div>
          <Footer />
        </div>
      </RainbowKitProvider>
      </QueryClientProvider>
      </WagmiProvider>

    );
}

export default MyApp;  

