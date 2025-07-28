"use client";

import { useState } from "react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NftAnalyzerPage() {
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const placeholders = [
    "Enter NFT contract address...",
    "Paste smart contract...",
    "Looking for a token?",
  ];

  const handleContractChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
  };

  const handleTokenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(e.target.value);
  };

  const runNftAnalysis = () => {
    setLoading(true);
    setResult(null);

    // Simulate API Mock response
    setTimeout(() => {
      setLoading(false);

      if (!contractAddress || contractAddress.length !== 42) {
        alert("Please enter a valid Ethereum contract address.");
        return;
      }

      if (!tokenId || isNaN(Number(tokenId))) {
        alert("Please enter a valid token ID.");
        return;
      }

      setResult(
        `✅ Token ${tokenId} from ${contractAddress} appears to be safe.\n\n• Metadata verified\n• No wash trading detected\n• Listed in 3 major marketplaces`
      );
    }, 2000);
  };

  return (
    <div className="max-w-xl w-full mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">
        NFT Analyzer
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        Enter a contract address and token ID to analyze an NFT's metadata and
        risk.
      </p>

      <div>
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleContractChange}
          onSubmit={runNftAnalysis}
        />
      </div>

     
      <input
        type="text"
        placeholder="Enter Token ID"
        value={tokenId}
        onChange={handleTokenIdChange}
        className="w-full px-4 py-2 border border-neutral-300 rounded-md dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
      />

      <div
        onClick={runNftAnalysis}
        className={cn(
          "cursor-pointer rounded bg-black dark:bg-zinc-900 text-white flex items-center justify-center px-4 py-2 transition-colors",
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
        )}
        aria-disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : "Analyze"}
      </div>

      {result && (
        <div className="whitespace-pre-line border p-4 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
          {result}
        </div>
      )}
    </div>
  );
}
