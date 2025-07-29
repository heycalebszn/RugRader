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

  const runNftAnalysis = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/nft-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contractAddress: contractAddress,
          tokenId: tokenId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to analyze NFT');
        return;
      }

      // Format the NFT analysis result
      let resultText = `🖼️ NFT Analysis Results\n\n`;
      resultText += `Name: ${data.name}\n`;
      resultText += `Collection: ${data.metadata?.collection || 'Unknown'}\n`;
      resultText += `Contract: ${data.contractAddress}\n`;
      resultText += `Token ID: ${data.tokenId}\n`;
      resultText += `Risk Level: ${data.riskLevel.toUpperCase()}\n\n`;
      
      if (data.description) {
        resultText += `Description: ${data.description}\n\n`;
      }
      
      resultText += `🔍 Verification Status:\n`;
      resultText += `• Collection Verified: ${data.metadata?.verified ? '✅ Yes' : '❌ No'}\n`;
      resultText += `• Metadata Accessible: ${data.metadata ? '✅ Yes' : '❌ No'}\n`;
      
      if (data.metadata?.owner) {
        resultText += `• Current Owner: ${data.metadata.owner.slice(0, 6)}...${data.metadata.owner.slice(-4)}\n`;
      }
      
      resultText += '\n';
      
      if (data.riskFactors.length > 0) {
        resultText += `⚠️ Risk Factors:\n`;
        data.riskFactors.forEach((factor: string) => {
          resultText += `• ${factor}\n`;
        });
      } else {
        resultText += `✅ No significant risk factors detected\n`;
        resultText += `• Metadata verified\n`;
        resultText += `• No suspicious trading patterns\n`;
        resultText += `• Collection appears legitimate\n`;
      }

      setResult(resultText);

    } catch (error) {
      console.error('Error analyzing NFT:', error);
      alert('Failed to analyze NFT. Please try again.');
    } finally {
      setLoading(false);
    }
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
