// lib/centralized-synapse.js
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';

// Your centralized storage wallet (keep this secure!)
// Server-side only - not exposed to client
const STORAGE_WALLET_PRIVATE_KEY = '0x0053b694aacec535e305a9f1fc9ae7d4070e31a29e84253215924635c148176e'

// Synapse configuration
export const SYNAPSE_CONFIG = {
  network: 'calibration', // Use 'mainnet' for production
  rpcUrl: RPC_URLS.calibration.websocket,
  withCDN: true
};

// Create centralized Synapse instance (uses your wallet for payments)
export const createCentralizedSynapseInstance = async () => {
  if (!STORAGE_WALLET_PRIVATE_KEY) {
    throw new Error('Storage wallet private key not configured');
  }

  try {
    const synapse = await Synapse.create({
      privateKey: STORAGE_WALLET_PRIVATE_KEY,
      rpcURL: SYNAPSE_CONFIG.rpcUrl,
      withCDN: SYNAPSE_CONFIG.withCDN
    });
    
    return synapse;
  } catch (error) {
    console.error('Failed to create centralized Synapse instance:', error);
    throw new Error(`Centralized storage initialization failed: ${error.message}`);
  }
};

// Upload file using centralized storage (you pay the costs)
export const uploadToCentralizedStorage = async (file, onProgress) => {
  let synapse;
  
  try {
    // Create centralized Synapse instance
    onProgress?.('Initializing decentralized storage...');
    synapse = await createCentralizedSynapseInstance();
    
    // Convert file to Uint8Array
    onProgress?.('Processing file...');
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Validate file size (Synapse limits: 127 bytes - 200 MiB)
    if (uint8Array.length < 127) {
      throw new Error('File too small (minimum 127 bytes)');
    }
    if (uint8Array.length > 200 * 1024 * 1024) {
      throw new Error('File too large (maximum 200 MiB)');
    }
    
    // Upload to Synapse (using your wallet/payment)
    onProgress?.('Uploading to Filecoin network...');
    console.log('Starting centralized upload, file size:', uint8Array.length);
    
    const result = await synapse.storage.upload(uint8Array);
    
    console.log('Centralized upload successful:', result);
    
    return {
      success: true,
      pieceCid: result.pieceCid,
      size: result.size,
      pieceId: result.pieceId
    };
    
  } catch (error) {
    console.error('Centralized upload error:', error);
    
    // Handle specific error types
    if (error.message.includes('insufficient funds')) {
      // This is now your problem to solve, not the user's
      console.error('CRITICAL: Storage wallet needs more USDFC balance!');
      throw new Error('Storage service temporarily unavailable. Please try again later.');
    } else if (error.message.includes('File too small')) {
      throw new Error('File is too small to store on Filecoin network');
    } else if (error.message.includes('File too large')) {
      throw new Error('File is too large (maximum 200 MB)');
    }
    
    throw new Error(`Upload failed: ${error.message}`);
    
  } finally {
    // Clean up Synapse connection
    if (synapse) {
      try {
        const provider = synapse.getProvider();
        if (provider && typeof provider.destroy === 'function') {
          await provider.destroy();
        }
      } catch (cleanupError) {
        console.warn('Synapse cleanup error:', cleanupError);
      }
    }
  }
};

// Download file from Synapse (no payment required for downloads)
export const downloadFromSynapse = async (pieceCid, userWalletClient, userPublicClient, onProgress) => {
  let synapse;
  
  try {
    if (!pieceCid) {
      throw new Error('PieceCID is required');
    }
    
    // Try to use user's connection first (faster), fallback to centralized
    onProgress?.('Connecting to Filecoin network...');
    
    try {
      // Attempt with user's wallet (no payment needed for downloads)
      synapse = await Synapse.create({
        provider: userWalletClient || userPublicClient,
        rpcURL: SYNAPSE_CONFIG.rpcUrl,
        withCDN: SYNAPSE_CONFIG.withCDN
      });
    } catch (userConnectionError) {
      console.log('User connection failed, using centralized:', userConnectionError.message);
      // Fallback to centralized connection
      synapse = await createCentralizedSynapseInstance();
    }
    
    // Download from Synapse
    onProgress?.('Downloading from Filecoin network...');
    const imageData = await synapse.storage.download(pieceCid);
    
    console.log('Download successful:', { pieceCid, size: imageData.length });
    
    return {
      success: true,
      data: imageData,
      size: imageData.length
    };
    
  } catch (error) {
    console.error('Download error:', error);
    
    if (error.message.includes('not found')) {
      throw new Error('Content not found on network');
    } else if (error.message.includes('provider')) {
      throw new Error('No storage providers available');
    }
    
    throw new Error(`Download failed: ${error.message}`);
    
  } finally {
    // Clean up Synapse connection
    if (synapse) {
      try {
        const provider = synapse.getProvider();
        if (provider && typeof provider.destroy === 'function') {
          await provider.destroy();
        }
      } catch (cleanupError) {
        console.warn('Synapse cleanup error:', cleanupError);
      }
    }
  }
};

// Check your centralized wallet balance (for monitoring)
export const checkCentralizedWalletBalance = async () => {
  let synapse;
  
  try {
    synapse = await createCentralizedSynapseInstance();
    
    const accountInfo = await synapse.payments.accountInfo();
    const walletBalance = await synapse.payments.walletBalance('USDFC');
    
    return {
      walletBalance: ethers.formatUnits(walletBalance, 18),
      availableFunds: ethers.formatUnits(accountInfo.availableFunds, 18),
      totalFunds: ethers.formatUnits(accountInfo.totalFunds, 18),
      lockedFunds: ethers.formatUnits(accountInfo.totalFunds - accountInfo.availableFunds, 18)
    };
    
  } catch (error) {
    console.error('Centralized balance check error:', error);
    throw new Error(`Balance check failed: ${error.message}`);
    
  } finally {
    if (synapse) {
      try {
        const provider = synapse.getProvider();
        if (provider && typeof provider.destroy === 'function') {
          await provider.destroy();
        }
      } catch (cleanupError) {
        console.warn('Synapse cleanup error:', cleanupError);
      }
    }
  }
};

// Utility to validate PieceCID format
export const isValidPieceCid = (pieceCid) => {
  if (!pieceCid || typeof pieceCid !== 'string') {
    return false;
  }
  
  // PieceCID v2 format: starts with 'bafkzcib', 64-65 characters
  const pieceCidV2Regex = /^bafkzcib[a-z2-7]{56,57}$/;
  
  // LegacyPieceCID v1 format: starts with 'baga6ea4seaq', 64 characters  
  const legacyPieceCidRegex = /^baga6ea4seaq[a-z2-7]{52}$/;
  
  return pieceCidV2Regex.test(pieceCid) || legacyPieceCidRegex.test(pieceCid);
};

// Create image blob URL from Uint8Array
export const createImageBlobUrl = (uint8Array, mimeType = 'image/jpeg') => {
  try {
    const blob = new Blob([uint8Array], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL:', error);
    throw new Error('Failed to create image URL');
  }
};

// Storage cost estimation (for your budgeting)
export const estimateStorageCost = (fileSizeBytes, durationDays = 30) => {
  // Rough estimates based on Synapse pricing
  const bytesPerGiB = 1024 * 1024 * 1024;
  const sizeInGiB = fileSizeBytes / bytesPerGiB;
  const costPerGiBPerMonth = 0.0000565; // USDFC
  const costPerDay = (costPerGiBPerMonth / 30) * sizeInGiB;
  const totalCost = costPerDay * durationDays;
  
  return {
    sizeInGiB,
    costPerDay: costPerDay.toFixed(8),
    totalCost: totalCost.toFixed(8),
    currency: 'USDFC'
  };
};

// Constants
export const CENTRALIZED_STORAGE_CONSTANTS = {
  NETWORK: SYNAPSE_CONFIG.network,
  RPC_URL: SYNAPSE_CONFIG.rpcUrl,
  MIN_FILE_SIZE: 127, // bytes
  MAX_FILE_SIZE: 200 * 1024 * 1024, // 200 MiB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ESTIMATED_COST_PER_GIB_PER_MONTH: 0.0000565 // USDFC
};