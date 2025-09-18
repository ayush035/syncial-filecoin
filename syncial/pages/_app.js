import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Footer from '@/components/Footer';

function MyApp({ Component, pageProps }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Component {...pageProps} />
        <Analytics />
        <SpeedInsights />
      </div>
      <Footer />
    </div>
  );
}

export default MyApp;
