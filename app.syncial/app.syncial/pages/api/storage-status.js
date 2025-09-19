// pages/api/storage-status.js
import { checkStorageBalance } from '../../lib/server-side-synapse';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const balance = await checkStorageBalance();
    
    res.status(200).json({
      status: 'operational',
      balance: balance,
      message: balance.availableFunds > 10 ? 'Storage service healthy' : 'Low balance warning'
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Storage service unavailable'
    });
  }
}