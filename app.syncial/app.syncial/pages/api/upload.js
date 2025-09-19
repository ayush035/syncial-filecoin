// pages/api/upload.js
import { uploadToFilecoin } from '../../lib/server-side-synapse';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let tempFilePath = null;

  try {
    // Parse multipart form data
    const form = new IncomingForm({
      maxFileSize: 200 * 1024 * 1024, // 200MB limit
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    tempFilePath = file.filepath;
    
    // Read file into buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    
    console.log('Received file:', file.originalFilename, 'Size:', fileBuffer.length);
    
    // Upload to Filecoin using your centralized wallet
    const result = await uploadToFilecoin(fileBuffer, file.originalFilename);
    
    // Return PieceCID to client
    res.status(200).json({
      success: true,
      pieceCid: result.pieceCid,
      size: result.size,
      fileName: result.fileName
    });
    
  } catch (error) {
    console.error('Upload API error:', error);
    
    let statusCode = 500;
    let message = 'Upload failed';
    
    if (error.message.includes('File too large')) {
      statusCode = 400;
      message = 'File too large (maximum 200 MB)';
    } else if (error.message.includes('File too small')) {
      statusCode = 400;
      message = 'File too small (minimum 127 bytes)';
    } else if (error.message.includes('insufficient funds')) {
      statusCode = 503;
      message = 'Storage service temporarily unavailable';
    }
    
    res.status(statusCode).json({ error: message });
    
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError);
      }
    }
  }
}