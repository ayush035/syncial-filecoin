import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  async function handleUpload() {
    if (!file || !walletClient || !isConnected) {
      return alert("Connect wallet & pick a file first");
    }

    setUploading(true);

    try {
      // Sign a message to prove ownership
      const message = "I am uploading a file to 0G";
      const signature = await walletClient.signMessage({ message });

      // Convert file → ArrayBuffer → Uint8Array → normal Array (serializable)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Array.from(new Uint8Array(arrayBuffer));

      // Send to backend API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBuffer: buffer,
          fileName: file.name,
          address,
          signature,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Upload success! Tx: ${data.tx}`);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }

    setUploading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload to 0G</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button disabled={uploading} onClick={handleUpload}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
