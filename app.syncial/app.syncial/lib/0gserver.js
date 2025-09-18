// lib/0gServer.js
import { Uploader } from "@0glabs/0g-ts-sdk";

export function get0GUploader() {
  return new Uploader({
    storageNodeUrl: process.env.OG_STORAGE_URL,
    indexerUrl: process.env.OG_INDEXER_URL,
    privateKey: process.env.PRIVATE_KEY, // stays server-side
  });
}
