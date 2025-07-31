"use client";

import { useState } from "react";
import { Loader2, Wallet, Image, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

type AnalysisType = 'wallet' | 'collection' | 'nft';

interface WalletResult {
  address: string;
  ethBalance: string;
  riskLevel: string;
  riskScore: number;
  tokens: Array<{
    address: string;
    name: string;
    symbol: string;
    balance: string;
    price?: number;
    riskLevel: string;
    riskFactors: string[];
  }>;
  nfts: Array<{
    contractAddress: string;
    tokenId: string;
    name: string;
    riskLevel: string;
    riskFactors: string[];
  }>;
  summary: string;
}

interface CollectionResult {
  contractAddress: string;
  name: string;
  totalSupply: number;
  holderCount: number;
  floorPrice?: number;
  riskLevel: string;
  riskFactors: string[];
  auditStatus: string;
  topHolders: Array<{
    address: string;
    count: number;
    percentage: number;
  }>;
}

interface NFTResult {
  contractAddress: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  riskLevel: string;
  riskFactors: string[];
  metadata?: {
    collection?: string;
    verified?: boolean;
    owner?: string;
    attributes?: Array<{
      trait_type?: string;
      type?: string;
      value: string | number;
    }>;
  };
}

interface RequestBody {
  address?: string;
  contractAddress?: string;
  tokenId?: string;
}

export default function Web3AnalyzerPage() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('wallet');
  const [address, setAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalletResult | CollectionResult | NFTResult | null>(null);

  const placeholders = {
    wallet: [
      "0x742d35Cc6634C0532925a3b8D4C0C3c6c8C8C6C6",
      "Enter Ethereum wallet address...",
      "Analyze wallet for risks...",
    ],
    collection: [
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "Enter NFT collection contract address...", 
      "Analyze collection risks...",
    ],
    nft: [
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "Enter NFT contract address...",
      "Analyze specific NFT...",
    ]
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleTokenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runAnalysis(address, tokenId);
  };

  const runAnalysis = async (inputAddress: string, inputTokenId?: string) => {
    setLoading(true);
    setResult(null);

    try {
      let endpoint = '';
      let body: RequestBody = {};

      switch (analysisType) {
        case 'wallet':
          endpoint = '/api/wallet-scan';
          body = { address: inputAddress };
          break;
        case 'collection':
          endpoint = '/api/collection-check';
          body = { contractAddress: inputAddress };
          break;
        case 'nft':
          endpoint = '/api/nft-analyzer';
          body = { contractAddress: inputAddress, tokenId: inputTokenId };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to analyze');
        setResult(null);
        return;
      }

      setResult(data);

    } catch (error) {
      console.error('Error during analysis:', error);
      alert('Failed to analyze. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeClick = () => {
    runAnalysis(address, tokenId);
  };

  const formatWalletResult = (data: WalletResult) => {
    let resultText = `📊 Wallet Analysis Results:\n\n`;
    resultText += `Address: ${data.address}\n`;
    resultText += `ETH Balance: ${parseFloat(data.ethBalance).toFixed(4)} ETH\n`;
    resultText += `Risk Level: ${data.riskLevel.toUpperCase()}\n`;
    resultText += `Risk Score: ${data.riskScore}/100\n\n`;
    
    if (data.tokens.length > 0) {
      resultText += `🪙 Tokens Found (${data.tokens.length}):\n`;
      data.tokens.forEach((token) => {
        resultText += `• ${token.symbol}: ${parseFloat(token.balance).toFixed(2)}`;
        if (token.price) {
          resultText += ` ($${(parseFloat(token.balance) * token.price).toFixed(2)})`;
        }
        resultText += ` (${token.riskLevel})\n`;
        if (token.riskFactors.length > 0) {
          resultText += `  ⚠️ ${token.riskFactors.join(', ')}\n`;
        }
      });
      resultText += '\n';
    }
    
    if (data.nfts.length > 0) {
      resultText += `🖼️ NFTs Found (${data.nfts.length}):\n`;
      data.nfts.forEach((nft) => {
        resultText += `• ${nft.name} (${nft.riskLevel})\n`;
        if (nft.riskFactors.length > 0) {
          resultText += `  ⚠️ ${nft.riskFactors.join(', ')}\n`;
        }
      });
      resultText += '\n';
    }
    
    resultText += `Summary: ${data.summary}`;
    return resultText;
  };

  const formatCollectionResult = (data: CollectionResult) => {
    let resultText = `📊 Collection Analysis Results:\n\n`;
    resultText += `Contract: ${data.contractAddress}\n`;
    resultText += `Name: ${data.name}\n`;
    resultText += `Total Supply: ${data.totalSupply.toLocaleString()}\n`;
    if (data.floorPrice) {
      resultText += `Floor Price: ${data.floorPrice.toFixed(4)} ETH\n`;
    }
    resultText += `Unique Holders: ${data.holderCount.toLocaleString()}\n`;
    resultText += `Risk Level: ${data.riskLevel.toUpperCase()}\n`;
    resultText += `Audit Status: ${data.auditStatus.toUpperCase()}\n\n`;
    
    if (data.topHolders.length > 0) {
      resultText += `🐋 Top Holders:\n`;
      data.topHolders.slice(0, 5).forEach((holder, index) => {
        resultText += `${index + 1}. ${holder.address.slice(0, 6)}...${holder.address.slice(-4)}: ${holder.count} (${holder.percentage.toFixed(1)}%)\n`;
      });
      resultText += '\n';
    }
    
    if (data.riskFactors.length > 0) {
      resultText += `⚠️ Risk Factors:\n`;
      data.riskFactors.forEach((factor) => {
        resultText += `• ${factor}\n`;
      });
    }
    
    return resultText;
  };

  const formatNFTResult = (data: NFTResult) => {
    let resultText = `📊 NFT Analysis Results:\n\n`;
    resultText += `Contract: ${data.contractAddress}\n`;
    resultText += `Token ID: ${data.tokenId}\n`;
    resultText += `Name: ${data.name}\n`;
    resultText += `Description: ${data.description}\n`;
    resultText += `Risk Level: ${data.riskLevel.toUpperCase()}\n\n`;
    
    if (data.metadata) {
      if (data.metadata.collection) {
        resultText += `Collection: ${data.metadata.collection}\n`;
      }
      if (data.metadata.owner) {
        resultText += `Owner: ${data.metadata.owner.slice(0, 6)}...${data.metadata.owner.slice(-4)}\n`;
      }
      resultText += `Verified: ${data.metadata.verified ? 'Yes' : 'No'}\n`;
      
      if (data.metadata?.attributes && data.metadata.attributes.length > 0) {
        resultText += `\n🎨 Attributes:\n`;
        data.metadata.attributes.slice(0, 5).forEach((attr: { trait_type?: string; type?: string; value: string | number }) => {
          resultText += `• ${attr.trait_type || attr.type}: ${attr.value}\n`;
        });
      }
      resultText += '\n';
    }
    
    if (data.riskFactors.length > 0) {
      resultText += `⚠️ Risk Factors:\n`;
      data.riskFactors.forEach((factor) => {
        resultText += `• ${factor}\n`;
      });
    }
    
    return resultText;
  };

  const getFormattedResult = () => {
    if (!result) return '';
    
    switch (analysisType) {
      case 'wallet':
        return formatWalletResult(result as WalletResult);
      case 'collection':
        return formatCollectionResult(result as CollectionResult);
      case 'nft':
        return formatNFTResult(result as NFTResult);
      default:
        return JSON.stringify(result, null, 2);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto mt-10 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
          Web3 Risk Analyzer
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Analyze Ethereum wallets, NFT collections, and individual NFTs for security risks
        </p>
      </div>

      {/* Analysis Type Selector */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setAnalysisType('wallet')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
            analysisType === 'wallet' 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          )}
        >
          <Wallet size={18} />
          <span>Wallet</span>
        </button>
        <button
          onClick={() => setAnalysisType('collection')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
            analysisType === 'collection' 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          )}
        >
          <Grid3X3 size={18} />
          <span>Collection</span>
        </button>
        <button
          onClick={() => setAnalysisType('nft')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
            analysisType === 'nft' 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          )}
        >
          <Image size={18} />
          <span>NFT</span>
        </button>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PlaceholdersAndVanishInput
              placeholders={placeholders[analysisType]}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </div>
          {analysisType === 'nft' && (
            <input
              type="text"
              placeholder="Token ID"
              value={tokenId}
              onChange={handleTokenIdChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-32"
            />
          )}
          <div
            onClick={handleAnalyzeClick}
            className={cn(
              "cursor-pointer rounded bg-black dark:bg-zinc-900 text-white flex items-center justify-center px-4 py-2 transition-colors",
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            )}
            aria-disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Analyze"}
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {analysisType === 'wallet' && "Enter an Ethereum wallet address to analyze tokens and NFTs for risks"}
          {analysisType === 'collection' && "Enter an NFT collection contract address to analyze holder distribution and risks"}
          {analysisType === 'nft' && "Enter an NFT contract address and token ID to analyze metadata and ownership"}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="border p-4 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
          <pre className="whitespace-pre-wrap text-sm">{getFormattedResult()}</pre>
        </div>
      )}
    </div>
  );
}
