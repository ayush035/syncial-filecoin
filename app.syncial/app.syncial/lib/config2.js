// Replace with your actual contract address after deployment
export const PREDICTION_MARKET_ADDRESS = "0xb1cfe2c411c1c88F95953962e3EbCe46C79f240c";

// Pyth Network addresses
export const PYTH_ADDRESSES = {
  // Filecoin caliberation Testnet
  314159: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"
  
};

// Pyth Price Feed IDs
export const PRICE_FEEDS = {
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  HBAR_USD: "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd",
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"

  // Add more as needed
};

export const SUPPORTED_CHAINS = [314159]; // Add your target chains

export const DEBUG_MODE = process.env.NODE_ENV === 'development';
