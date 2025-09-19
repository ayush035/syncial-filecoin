// lib/server-side-synapse.js (Server-side only)
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';

// This runs ONLY on your server with YOUR wallet
const STORAGE_PRIVATE_KEY = process.env.STORAGE_PRIVATE_KEY;

let synapseInstance = null;

// Create singleton Synapse instance to reuse connections
export const getSynapseInstance = async () => {
  if (!synapseInstance) {
    if (!STORAGE_PRIVATE_KEY) {
      throw new Error('STORAGE_PRIVATE_KEY not configured in environment');
    }

    synapseInstance = await Synapse.create({
      privateKey: STORAGE_PRIVATE_KEY,
      rpcURL: RPC_URLS.calibration.websocket,
      withCDN: true
    });

    console.log('Created Synapse instance with centralized wallet');
  }
  
  return synapseInstance;
};

// Server-side upload function
export const uploadToFilecoin = async (fileBuffer, fileName) => {
  try {
    console.log('Starting server-side Filecoin upload:', fileName);
    
    const synapse = await getSynapseInstance();
    
    // Convert buffer to Uint8Array
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Validate size constraints
    if (uint8Array.length < 127) {
      throw new Error('File too small (minimum 127 bytes)');
    }
    if (uint8Array.length > 200 * 1024 * 1024) {
      throw new Error('File too large (maximum 200 MB)');
    }
    
    console.log('Uploading to Filecoin, size:', uint8Array.length);
    
    // Upload using YOUR wallet (all payments handled by your account)
    const result = await synapse.storage.upload(uint8Array);
    
    console.log('Filecoin upload successful:', result.pieceCid);
    
    return {
      success: true,
      pieceCid: result.pieceCid,
      size: result.size,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('Server-side upload error:', error);
    
    if (error.message.includes('insufficient funds')) {
      throw new Error('Storage service temporarily unavailable - insufficient funds');
    }
    
    throw error;
  }
};

// Server-side download function  
export const downloadFromFilecoin = async (pieceCid) => {
  try {
    console.log('Starting server-side download:', pieceCid);
    
    const synapse = await getSynapseInstance();
    
    // Download using your account
    const data = await synapse.storage.download(pieceCid);
    
    console.log('Download successful, size:', data.length);
    
    return data;
    
  } catch (error) {
    console.error('Server-side download error:', error);
    throw error;
  }
};

// Check your storage wallet balance (for monitoring)
export const checkStorageBalance = async () => {
  try {
    const synapse = await getSynapseInstance();
    
    const accountInfo = await synapse.payments.accountInfo();
    const walletBalance = await synapse.payments.walletBalance('USDFC');
    
    return {
      walletBalance: ethers.formatUnits(walletBalance, 18),
      availableFunds: ethers.formatUnits(accountInfo.availableFunds, 18),
      totalFunds: ethers.formatUnits(accountInfo.totalFunds, 18),
      lockedFunds: ethers.formatUnits(accountInfo.totalFunds - accountInfo.availableFunds, 18)
    };
  } catch (error) {
    console.error('Balance check error:', error);
    throw error;
  }
};