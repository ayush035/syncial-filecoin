import { ethers } from 'ethers';
import { ZG_CONFIG } from './config.js';

class ZGStorageService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(ZG_CONFIG.RPC_URL);
  }

  // Browser-compatible upload using API endpoints
  async uploadImage(file, walletClient) {
    try {
      // Convert file to hex string for API upload
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const hexString = Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Get signer for transaction signing
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Calculate file hash (simple approach for browser)
      const fileHash = ethers.keccak256('0x' + hexString);
      
      // Create upload payload
      const uploadData = {
        data: hexString,
        filename: file.name,
        size: file.size,
        contentType: file.type,
        uploader: address,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      // Upload to 0G network via API
      const response = await fetch(`${ZG_CONFIG.INDEXER_RPC}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        rootHash: result.root_hash || fileHash, // Use returned hash or fallback
        txHash: result.tx_hash,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('0G Upload Error:', error);
      // Fallback: Use file hash as identifier
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const hexString = Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const fileHash = ethers.keccak256('0x' + hexString);
      
      // Store in IndexedDB as fallback
      await this.storeInIndexedDB(fileHash, file);
      
      return {
        rootHash: fileHash,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        fallback: true
      };
    }
  }

  // IndexedDB fallback storage
  async storeInIndexedDB(hash, file) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('0g-storage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        
        const fileData = {
          hash,
          file: file,
          timestamp: Date.now()
        };
        
        store.put(fileData);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'hash' });
        }
      };
    });
  }

  // Get image from IndexedDB fallback
  async getFromIndexedDB(hash) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('0g-storage', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const getRequest = store.get(hash);
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          if (result) {
            resolve(URL.createObjectURL(result.file));
          } else {
            reject(new Error('File not found'));
          }
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Generate 0G storage URL for displaying images
  getImageUrl(rootHash) {
    // First try 0G network
    return `${ZG_CONFIG.INDEXER_RPC}/download/${rootHash}`;
  }

  // Get image with fallback to IndexedDB
  async getImageUrlWithFallback(rootHash) {
    try {
      // Try 0G network first
      const response = await fetch(`${ZG_CONFIG.INDEXER_RPC}/download/${rootHash}`);
      if (response.ok) {
        return `${ZG_CONFIG.INDEXER_RPC}/download/${rootHash}`;
      }
    } catch (error) {
      console.log('0G network unavailable, trying fallback...');
    }
    
    // Fallback to IndexedDB
    try {
      return await this.getFromIndexedDB(rootHash);
    } catch (error) {
      console.error('Fallback failed:', error);
      return null;
    }
  }

  // Check if 0G storage is accessible
  async healthCheck() {
    try {
      const response = await fetch(`${ZG_CONFIG.INDEXER_RPC}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const zgStorage = new ZGStorageService();