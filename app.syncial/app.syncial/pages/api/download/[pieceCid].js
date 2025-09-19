// pages/api/download/[pieceCid].js
import { downloadFromFilecoin } from '../../../lib/server-side-synapse';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pieceCid } = req.query;
  
  if (!pieceCid) {
    return res.status(400).json({ error: 'PieceCID required' });
  }

  try {
    console.log('Download request for:', pieceCid);
    
    // Download from Filecoin using your centralized wallet
    const imageData = await downloadFromFilecoin(pieceCid);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageData.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send image data directly
    res.status(200).send(Buffer.from(imageData));
    
  } catch (error) {
    console.error('Download API error:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: 'Image not found' });
    } else {
      res.status(500).json({ error: 'Download failed' });
    }
  }
}