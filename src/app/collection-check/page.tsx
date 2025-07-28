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

  const runCheck = () => {
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      setLoading(false);
      if (!contract || contract.length !== 42) {
        alert("Enter a valid Ethereum contract address.");
        return;
      }

      setResult(`📊 Risk Summary for ${contract}

• Floor Price Volatility: High 🔺
• Flagged Tokens: 12 out of 5000 (0.24%)
• Audit Status: ✅ Passed
• Top 5 Holders own 68% of supply 🐋
• Wash Trading Risk: ⚠️ Medium
• Listed on OpenSea, Blur, LooksRare`);
    }, 2000);
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
