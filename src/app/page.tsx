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

  
  const runScan = (inputAddress: string) => {
    setLoading(true);
    setResult(null);

    
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

    setTimeout(() => {
      setLoading(false);
      if (inputAddress.toLowerCase() === testAddress.toLowerCase()) {
        alert("Test address detected!");
        setResult("This is a test address with no risk.");
      } else if (!inputAddress || inputAddress.length !== 42) {
        alert("Please enter a valid Ethereum address.");
        setResult(null);
      } else {
        // Simulated result for other addresses
        setResult("This wallet has 3 risky tokens and 1 flagged NFT.");
      }
    }, 2000);
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
