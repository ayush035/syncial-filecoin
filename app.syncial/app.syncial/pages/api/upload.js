import fs from "fs";
import path from "path";
import { Indexer, ZgFile } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export default async function handler(req, res) {
  try {
    const { fileBuffer, fileName, signature, address } = req.body;

    // Optional: verify signature
    const recovered = ethers.verifyMessage("I am uploading a file to 0G", signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    // Save file temporarily
    const filePath = path.join("/tmp", fileName);
    await fs.promises.writeFile(filePath, Buffer.from(fileBuffer));

    // Upload via 0G SDK
    const file = await ZgFile.fromFilePath(filePath);
    const [tree] = await file.merkleTree();

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const indexer = new Indexer();
    const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer);
    if (uploadErr) throw new Error(uploadErr);

    await file.close();
    res.status(200).json({ tx, rootHash: tree?.rootHash() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
