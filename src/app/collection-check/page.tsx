"use client";

import { useState } from "react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CollectionCheckPage() {
  const [contract, setContract] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContract(e.target.value);
  };

  const runCheck = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/collection-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractAddress: contract }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to analyze collection');
        return;
      }

      // Format the collection analysis result
      let resultText = `📊 Risk Summary for ${data.name || 'Collection'}\n`;
      resultText += `Contract: ${data.contractAddress}\n\n`;
      
      resultText += `📈 Collection Stats:\n`;
      resultText += `• Total Supply: ${data.totalSupply.toLocaleString()}\n`;
      resultText += `• Unique Holders: ${data.holderCount.toLocaleString()}\n`;
      if (data.floorPrice) {
        resultText += `• Floor Price: ${data.floorPrice.toFixed(3)} ETH\n`;
      }
      resultText += `• Audit Status: ${data.auditStatus === 'passed' ? '✅ Passed' : 
                                        data.auditStatus === 'failed' ? '❌ Failed' : '❓ Unknown'}\n`;
      resultText += `• Risk Level: ${data.riskLevel.toUpperCase()}\n\n`;
      
      if (data.topHolders.length > 0) {
        resultText += `🐋 Top Holders:\n`;
        data.topHolders.forEach((holder: any, index: number) => {
          resultText += `${index + 1}. ${holder.address.slice(0, 6)}...${holder.address.slice(-4)}: ${holder.count} tokens (${holder.percentage.toFixed(1)}%)\n`;
        });
        resultText += '\n';
      }
      
      if (data.riskFactors.length > 0) {
        resultText += `⚠️ Risk Factors:\n`;
        data.riskFactors.forEach((factor: string) => {
          resultText += `• ${factor}\n`;
        });
      } else {
        resultText += `✅ No significant risk factors detected\n`;
      }

      setResult(resultText);

    } catch (error) {
      console.error('Error analyzing collection:', error);
      alert('Failed to analyze collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">
        Collection Risk Analyzer
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        Enter the contract address of an NFT collection to analyze holder risk,
        flagged tokens, and audit info.
      </p>

      <PlaceholdersAndVanishInput
        placeholders={[
          "Paste collection contract address...",
          "0xCollectionAddress...",
        ]}
        onChange={handleChange}
        onSubmit={runCheck}
      />

      <div
        onClick={runCheck}
        className={cn(
          "cursor-pointer rounded bg-black dark:bg-zinc-900 text-white flex items-center justify-center px-4 py-2 transition-colors",
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
        )}
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
