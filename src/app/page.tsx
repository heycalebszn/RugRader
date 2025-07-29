"use client";

import { useState } from "react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"; 
import { Loader2 } from "lucide-react"; 
import { cn } from "@/lib/utils"; 

export default function WalletScannerPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const placeholders = [
    "Search something...",
    "Type your query...",
    "Looking for info?",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runScan(address);
  };

  
  const runScan = async (inputAddress: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/wallet-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: inputAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to analyze wallet');
        setResult(null);
        return;
      }

      // Format the analysis result
      let resultText = `📊 Wallet Analysis Results:\n\n`;
      resultText += `Address: ${data.address}\n`;
      resultText += `ETH Balance: ${parseFloat(data.ethBalance).toFixed(4)} ETH\n`;
      resultText += `Risk Level: ${data.riskLevel.toUpperCase()}\n`;
      resultText += `Risk Score: ${data.riskScore}/100\n\n`;
      
      if (data.tokens.length > 0) {
        resultText += `🪙 Tokens Found (${data.tokens.length}):\n`;
        data.tokens.forEach((token: any) => {
          resultText += `• ${token.symbol}: ${parseFloat(token.balance).toFixed(2)} (${token.riskLevel})\n`;
          if (token.riskFactors.length > 0) {
            resultText += `  ⚠️ ${token.riskFactors.join(', ')}\n`;
          }
        });
        resultText += '\n';
      }
      
      if (data.nfts.length > 0) {
        resultText += `🖼️ NFTs Found (${data.nfts.length}):\n`;
        data.nfts.forEach((nft: any) => {
          resultText += `• ${nft.name} (${nft.riskLevel})\n`;
          if (nft.riskFactors.length > 0) {
            resultText += `  ⚠️ ${nft.riskFactors.join(', ')}\n`;
          }
        });
        resultText += '\n';
      }
      
      resultText += `Summary: ${data.summary}`;
      setResult(resultText);

    } catch (error) {
      console.error('Error scanning wallet:', error);
      alert('Failed to analyze wallet. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanClick = () => {
    runScan(address);
  };

  return (
    <div className="max-w-xl w-full mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">
        Wallet Scanner
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        Enter any Ethereum address to analyze wallet risk.
      </p>

      <div className="flex items-center gap-2">
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />
        <div
          onClick={handleScanClick}
          className={cn(
            "cursor-pointer rounded bg-black dark:bg-zinc-900 text-white flex items-center justify-center px-4 py-2 transition-colors",
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
          )}
          aria-disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Scan"}
        </div>
      </div>

      {result && (
        <div className="border p-4 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
          {result}
        </div>
      )}
    </div>
  );
}
