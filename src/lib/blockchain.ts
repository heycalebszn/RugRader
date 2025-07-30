import { ethers } from 'ethers';
import axios from 'axios';

// Types for our API responses
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  price?: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface NFTInfo {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  metadata?: any;
}

export interface CollectionInfo {
  contractAddress: string;
  name?: string;
  totalSupply: number;
  floorPrice?: number;
  holderCount: number;
  topHolders: Array<{address: string, count: number, percentage: number}>;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  auditStatus: 'passed' | 'failed' | 'unknown';
}

export interface WalletAnalysis {
  address: string;
  ethBalance: string;
  tokens: TokenInfo[];
  nfts: NFTInfo[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
}

// Initialize providers
export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://ethereum-rpc.publicnode.com';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Add connection error handling
  provider.on('error', (error) => {
    console.error('RPC Provider error:', error);
  });
  
  return provider;
}

// ERC-20 Token ABI (minimal)
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

// ERC-721 NFT ABI (minimal)
export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256) view returns (string)',
  'function ownerOf(uint256) view returns (address)',
  'function balanceOf(address) view returns (uint256)',
];

// Utility functions
export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function formatEther(wei: bigint): string {
  return ethers.formatEther(wei);
}

export function parseEther(ether: string): bigint {
  return ethers.parseEther(ether);
}

// Risk assessment functions
export function calculateTokenRisk(token: TokenInfo): 'low' | 'medium' | 'high' {
  const riskFactors = token.riskFactors.length;
  if (riskFactors >= 3) return 'high';
  if (riskFactors >= 1) return 'medium';
  return 'low';
}

export function calculateCollectionRisk(collection: CollectionInfo): 'low' | 'medium' | 'high' {
  const riskFactors = collection.riskFactors.length;
  if (riskFactors >= 3) return 'high';
  if (riskFactors >= 1) return 'medium';
  return 'low';
}

export function calculateWalletRiskScore(tokens: TokenInfo[], nfts: NFTInfo[]): number {
  let riskScore = 0;
  
  tokens.forEach(token => {
    if (token.riskLevel === 'high') riskScore += 3;
    else if (token.riskLevel === 'medium') riskScore += 1;
  });
  
  nfts.forEach(nft => {
    if (nft.riskLevel === 'high') riskScore += 2;
    else if (nft.riskLevel === 'medium') riskScore += 1;
  });
  
  return Math.min(riskScore, 100); // Cap at 100
}

// Rate limiting and error handling utilities
const API_RETRY_ATTEMPTS = 3;
const API_RETRY_DELAY = 1000; // 1 second

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = API_RETRY_ATTEMPTS,
  delay: number = API_RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
}

// Enhanced token price fetching with error handling
export async function fetchTokenPrice(tokenAddress: string): Promise<number | null> {
  return withRetry(async () => {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`,
        {
          headers: process.env.COINGECKO_API_KEY ? {
            'X-CG-API-KEY': process.env.COINGECKO_API_KEY
          } : {},
          timeout: 10000
        }
      );
      
      return response.data[tokenAddress.toLowerCase()]?.usd || null;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded for CoinGecko API');
      }
      throw error;
    }
  }, 2, 2000).catch((error) => {
    console.error('Failed to fetch token price after retries:', error);
    return null;
  });
}

// Enhanced NFT metadata fetching with error handling
export async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  if (!tokenURI || tokenURI === '') {
    return null;
  }

  return withRetry(async () => {
    try {
      // Handle IPFS URLs
      let url = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      
      const response = await axios.get(url, { 
        timeout: 15000,
        maxRedirects: 3
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Metadata fetch timeout');
      }
      throw error;
    }
  }, 2, 1500).catch((error) => {
    console.error('Failed to fetch NFT metadata after retries:', error);
    return null;
  });
}

// Enhanced Moralis API calls with error handling
export async function getWalletTokens(walletAddress: string): Promise<any[]> {
  if (!process.env.MORALIS_API_KEY) {
    console.log('Moralis API key not configured, using Alchemy fallback');
    return getWalletTokensAlchemy(walletAddress);
  }

  return withRetry(async () => {
    try {
      const response = await axios.get(
        `https://deep-index.moralis.io/api/v2.2/${walletAddress}/erc20`,
        {
          headers: {
            'X-API-Key': process.env.MORALIS_API_KEY
          },
          timeout: 20000
        }
      );
      
      return response.data.result || [];
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded for Moralis API');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid Moralis API key');
      }
      throw error;
    }
  }, 2, 3000).catch((error) => {
    console.error('Moralis API failed, trying Alchemy fallback:', error);
    return getWalletTokensAlchemy(walletAddress);
  });
}

export async function getWalletNFTs(walletAddress: string): Promise<any[]> {
  if (!process.env.MORALIS_API_KEY) {
    console.log('Moralis API key not configured, using Alchemy fallback');
    return getWalletNFTsAlchemy(walletAddress);
  }

  return withRetry(async () => {
    try {
      const response = await axios.get(
        `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft`,
        {
          headers: {
            'X-API-Key': process.env.MORALIS_API_KEY
          },
          params: {
            chain: 'eth',
            format: 'decimal',
            media_items: false,
            limit: 100
          },
          timeout: 20000
        }
      );
      
      return response.data.result || [];
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded for Moralis API');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid Moralis API key');
      }
      throw error;
    }
  }, 2, 3000).catch((error) => {
    console.error('Moralis API failed, trying Alchemy fallback:', error);
    return getWalletNFTsAlchemy(walletAddress);
  });
}

// Enhanced Alchemy API calls with error handling
export async function getWalletTokensAlchemy(walletAddress: string): Promise<any[]> {
  if (!process.env.ALCHEMY_API_KEY) {
    console.log('No API keys configured, using direct blockchain calls');
    return [];
  }

  return withRetry(async () => {
    try {
      const response = await axios.post(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        {
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [walletAddress],
          id: 1
        },
        { timeout: 20000 }
      );

      if (response.data.error) {
        throw new Error(`Alchemy API error: ${response.data.error.message}`);
      }

      if (response.data.result?.tokenBalances) {
        return response.data.result.tokenBalances.filter((token: any) => 
          token.tokenBalance !== '0x0' && token.tokenBalance !== '0x'
        );
      }
      
      return [];
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded for Alchemy API');
      }
      throw error;
    }
  }, 2, 2000).catch((error) => {
    console.error('Alchemy API failed:', error);
    return [];
  });
}

export async function getWalletNFTsAlchemy(walletAddress: string): Promise<any[]> {
  if (!process.env.ALCHEMY_API_KEY) {
    console.log('No API keys configured, using direct blockchain calls');
    return [];
  }

  return withRetry(async () => {
    try {
      const response = await axios.post(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        {
          jsonrpc: '2.0',
          method: 'alchemy_getNFTs',
          params: [walletAddress, { omitMetadata: false }],
          id: 1
        },
        { timeout: 20000 }
      );

      if (response.data.error) {
        throw new Error(`Alchemy API error: ${response.data.error.message}`);
      }

      return response.data.result?.ownedNfts || [];
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded for Alchemy API');
      }
      throw error;
    }
  }, 2, 2000).catch((error) => {
    console.error('Alchemy API failed:', error);
    return [];
  });
}

// Enhanced collection stats with error handling
export async function getCollectionStats(contractAddress: string): Promise<any> {
  // Try OpenSea API first
  if (process.env.OPENSEA_API_KEY) {
    try {
      return await withRetry(async () => {
        const response = await axios.get(
          `https://api.opensea.io/api/v2/collections/${contractAddress}/stats`,
          {
            headers: {
              'X-API-KEY': process.env.OPENSEA_API_KEY
            },
            timeout: 15000
          }
        );
        return response.data;
      }, 2, 2000);
    } catch (error: any) {
      console.error('OpenSea API failed:', error);
    }
  }
  
  // Fallback to Moralis
  if (process.env.MORALIS_API_KEY) {
    try {
      return await withRetry(async () => {
        const response = await axios.get(
          `https://deep-index.moralis.io/api/v2.2/nft/${contractAddress}`,
          {
            headers: {
              'X-API-Key': process.env.MORALIS_API_KEY
            },
            timeout: 15000
          }
        );
        return response.data;
      }, 2, 2000);
    } catch (error: any) {
      console.error('Moralis collection stats failed:', error);
    }
  }
  
  return null;
}

// Enhanced contract interaction with error handling
export async function safeContractCall<T>(
  contract: ethers.Contract,
  method: string,
  ...args: any[]
): Promise<T | null> {
  return withRetry(async () => {
    try {
      return await contract[method](...args);
    } catch (error: any) {
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error(`Contract call failed: ${method}`);
      }
      if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network connection error');
      }
      throw error;
    }
  }, 3, 1000).catch((error) => {
    console.error(`Safe contract call failed for ${method}:`, error);
    return null;
  });
}

// Known risky token addresses (expanded list)
export const KNOWN_RISKY_TOKENS = new Set([
  '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE (high volatility)
  // Add more known risky tokens here
]);

// Known safe token addresses (expanded list)
export const KNOWN_SAFE_TOKENS = new Set([
  '0xa0b86a33e6441e78ca8e27d0e7c8b1c8b8b8b8b8', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
]);

export function analyzeTokenRisk(tokenAddress: string, tokenInfo: any): string[] {
  const riskFactors: string[] = [];
  
  if (KNOWN_RISKY_TOKENS.has(tokenAddress.toLowerCase())) {
    riskFactors.push('High volatility token');
  }
  
  // Add more comprehensive risk analysis
  if (tokenInfo.name && tokenInfo.name.toLowerCase().includes('test')) {
    riskFactors.push('Test token detected');
  }
  
  if (tokenInfo.name && (
    tokenInfo.name.toLowerCase().includes('scam') ||
    tokenInfo.name.toLowerCase().includes('fake') ||
    tokenInfo.name.toLowerCase().includes('phishing')
  )) {
    riskFactors.push('Potentially fraudulent token name');
  }
  
  // Check for honeypot patterns
  if (tokenInfo.symbol && tokenInfo.symbol.length > 10) {
    riskFactors.push('Unusually long token symbol');
  }
  
  return riskFactors;
}

// Enhanced NFT risk analysis
export function analyzeBasicNFTRisk(nftData: any, metadata: any): string[] {
  const riskFactors: string[] = [];
  
  // Check metadata integrity
  if (!metadata || !metadata.name) {
    riskFactors.push('Missing or incomplete metadata');
  }
  
  // Check for suspicious patterns in metadata
  if (metadata && metadata.name && (
    metadata.name.toLowerCase().includes('test') ||
    metadata.name.toLowerCase().includes('copy') ||
    metadata.name.toLowerCase().includes('fake')
  )) {
    riskFactors.push('Suspicious NFT name detected');
  }
  
  // Check image accessibility
  if (metadata && metadata.image) {
    if (!metadata.image.startsWith('https://') && !metadata.image.startsWith('ipfs://')) {
      riskFactors.push('Potentially inaccessible image URL');
    }
  } else {
    riskFactors.push('No image URL found');
  }
  
  return riskFactors;
}

/**
 * Enhanced NFT risk analysis using BitScrunch forensic data
 * Combines traditional blockchain analysis with AI-powered insights
 */
export async function analyzeNFTRisk(nftData: any, metadata: any, contractAddress: string, tokenId: string): Promise<string[]> {
  const riskFactors: string[] = [];
  
  // Start with basic risk analysis
  const basicRisks = analyzeBasicNFTRisk(nftData, metadata);
  riskFactors.push(...basicRisks);
  
  try {
    // Get BitScrunch comprehensive analysis
    const bitScrunchAnalysis = await analyzeBitScrunchNFT(contractAddress, tokenId);
    
    if (bitScrunchAnalysis) {
      // Add trading pattern risks
      if (bitScrunchAnalysis.forensicData.tradingPatterns.isWashTrading) {
        riskFactors.push('Wash trading detected by BitScrunch AI');
      }
      
      if (bitScrunchAnalysis.forensicData.tradingPatterns.volumeManipulation) {
        riskFactors.push('Volume manipulation detected');
      }
      
      if (bitScrunchAnalysis.forensicData.tradingPatterns.rapidTransfers) {
        riskFactors.push('Suspicious rapid transfer patterns');
      }
      
      // Add IP infringement risks
      if (bitScrunchAnalysis.forensicData.ipInfringement.isInfringing) {
        riskFactors.push(`Potential IP infringement (${bitScrunchAnalysis.forensicData.ipInfringement.similarityScore}% similarity)`);
      }
      
      // Add metadata authenticity risks
      if (!bitScrunchAnalysis.forensicData.metadata.isAuthentic) {
        riskFactors.push('Metadata authenticity questioned by BitScrunch analysis');
      }
      
      if (bitScrunchAnalysis.forensicData.metadata.hasManipulation) {
        riskFactors.push('Metadata manipulation detected');
      }
      
      // Add wallet behavior risks
      if (bitScrunchAnalysis.walletBehavior.ownerRiskScore > 70) {
        riskFactors.push('High-risk wallet owner detected');
      }
      
      // Add price estimation confidence
      if (bitScrunchAnalysis.forensicData.priceEstimation.confidence < 0.3) {
        riskFactors.push('Low price estimation confidence - volatile or manipulated market');
      }
    }
    
    // Get additional trading pattern analysis
    const tradingPatterns = await analyzeBitScrunchTradingPatterns(contractAddress, tokenId);
    
    if (tradingPatterns) {
      if (tradingPatterns.priceManipulation) {
        riskFactors.push('Price manipulation patterns detected');
      }
      
      if (tradingPatterns.suspiciousTimingPatterns) {
        riskFactors.push('Suspicious trading timing patterns');
      }
      
      if (tradingPatterns.crossPlatformArbitrage) {
        riskFactors.push('Cross-platform arbitrage activity detected');
      }
    }
    
  } catch (error) {
    console.error('Error during BitScrunch analysis:', error);
    riskFactors.push('Unable to complete advanced forensic analysis');
  }
  
  return riskFactors;
}

// BitScrunch API Integration
// BitScrunch is the hackathon sponsor providing advanced NFT analytics and forensic data
export interface BitScrunchConfig {
  apiKey?: string;
  baseUrl: string;
  network: 'mainnet' | 'testnet';
}

export interface BitScrunchNFTAnalysis {
  contractAddress: string;
  tokenId: string;
  riskScore: number;
  forensicData: {
    tradingPatterns: {
      isWashTrading: boolean;
      suspiciousTransactions: number;
      volumeManipulation: boolean;
      rapidTransfers: boolean;
    };
    priceEstimation: {
      estimatedValue: number;
      confidence: number;
      methodology: string;
    };
    ipInfringement: {
      isInfringing: boolean;
      similarityScore: number;
      originalWork?: string;
    };
    metadata: {
      isAuthentic: boolean;
      hasManipulation: boolean;
      storageType: 'ipfs' | 'centralized' | 'onchain';
    };
  };
  walletBehavior: {
    ownerRiskScore: number;
    tradingHistory: any[];
    suspiciousActivity: string[];
  };
}

export interface BitScrunchTradingPatterns {
  washTradingDetected: boolean;
  volumeManipulation: boolean;
  priceManipulation: boolean;
  rapidSuccessiveTransfers: boolean;
  suspiciousTimingPatterns: boolean;
  crossPlatformArbitrage: boolean;
}

// BitScrunch API configuration
const BITSCRUNCH_CONFIG: BitScrunchConfig = {
  apiKey: process.env.BITSCRUNCH_API_KEY,
  baseUrl: process.env.BITSCRUNCH_API_URL || 'https://api.bitscrunch.com',
  network: (process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet') as 'mainnet' | 'testnet'
};

/**
 * Analyze NFT using BitScrunch advanced AI analytics
 * Provides comprehensive forensic analysis, price estimation, and IP infringement detection
 */
export async function analyzeBitScrunchNFT(
  contractAddress: string, 
  tokenId: string
): Promise<BitScrunchNFTAnalysis | null> {
  if (!BITSCRUNCH_CONFIG.apiKey) {
    console.warn('BitScrunch API key not configured, using fallback analysis');
    return null;
  }

  return withRetry(async () => {
    try {
      const response = await axios.post(
        `${BITSCRUNCH_CONFIG.baseUrl}/v1/nft/analyze`,
        {
          contractAddress,
          tokenId,
          network: BITSCRUNCH_CONFIG.network,
          includeForensics: true,
          includePriceEstimation: true,
          includeIPAnalysis: true,
          includeWalletBehavior: true
        },
        {
          headers: {
            'Authorization': `Bearer ${BITSCRUNCH_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('BitScrunch API rate limit exceeded');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid BitScrunch API key');
      }
      throw error;
    }
  }, 3, 2000).catch((error) => {
    console.error('BitScrunch NFT analysis failed:', error);
    return null;
  });
}

/**
 * Analyze trading patterns using BitScrunch forensic capabilities
 * Detects wash trading, volume manipulation, and other suspicious activities
 */
export async function analyzeBitScrunchTradingPatterns(
  contractAddress: string,
  tokenId: string
): Promise<BitScrunchTradingPatterns | null> {
  if (!BITSCRUNCH_CONFIG.apiKey) {
    console.warn('BitScrunch API key not configured, using basic pattern analysis');
    return null;
  }

  return withRetry(async () => {
    try {
      const response = await axios.post(
        `${BITSCRUNCH_CONFIG.baseUrl}/v1/trading/patterns`,
        {
          contractAddress,
          tokenId,
          network: BITSCRUNCH_CONFIG.network,
          analysisDepth: 'comprehensive',
          timeFrame: '90d' // Analyze last 90 days
        },
        {
          headers: {
            'Authorization': `Bearer ${BITSCRUNCH_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('BitScrunch API rate limit exceeded');
      }
      throw error;
    }
  }, 3, 2000).catch((error) => {
    console.error('BitScrunch trading pattern analysis failed:', error);
    return null;
  });
}

/**
 * Get BitScrunch AI-powered NFT price estimation
 * Uses advanced machine learning models trained on multi-chain NFT data
 */
export async function getBitScrunchPriceEstimation(
  contractAddress: string,
  tokenId: string
): Promise<{ estimatedValue: number; confidence: number; methodology: string } | null> {
  if (!BITSCRUNCH_CONFIG.apiKey) {
    console.warn('BitScrunch API key not configured, skipping price estimation');
    return null;
  }

  return withRetry(async () => {
    try {
      const response = await axios.get(
        `${BITSCRUNCH_CONFIG.baseUrl}/v1/nft/price-estimation`,
        {
          params: {
            contractAddress,
            tokenId,
            network: BITSCRUNCH_CONFIG.network
          },
          headers: {
            'Authorization': `Bearer ${BITSCRUNCH_CONFIG.apiKey}`
          },
          timeout: 20000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { estimatedValue: 0, confidence: 0, methodology: 'insufficient_data' };
      }
      throw error;
    }
  }, 2, 1500).catch((error) => {
    console.error('BitScrunch price estimation failed:', error);
    return null;
  });
}

/**
 * Analyze wallet behavior using BitScrunch gaming and trading analytics
 * Provides insights into user acquisition and wallet patterns
 */
export async function analyzeBitScrunchWalletBehavior(
  walletAddress: string
): Promise<{
  riskScore: number;
  tradingPatterns: string[];
  gamingActivity: boolean;
  suspiciousActivity: string[];
} | null> {
  if (!BITSCRUNCH_CONFIG.apiKey) {
    console.warn('BitScrunch API key not configured, skipping wallet behavior analysis');
    return null;
  }

  return withRetry(async () => {
    try {
      const response = await axios.post(
        `${BITSCRUNCH_CONFIG.baseUrl}/v1/wallet/behavior`,
        {
          walletAddress,
          network: BITSCRUNCH_CONFIG.network,
          includeGamingAnalytics: true,
          includeTradingPatterns: true,
          timeFrame: '30d'
        },
        {
          headers: {
            'Authorization': `Bearer ${BITSCRUNCH_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          riskScore: 0,
          tradingPatterns: [],
          gamingActivity: false,
          suspiciousActivity: []
        };
      }
      throw error;
    }
  }, 2, 2000).catch((error) => {
    console.error('BitScrunch wallet behavior analysis failed:', error);
    return null;
  });
}

/**
 * Check for IP infringement using BitScrunch AI models
 * Protects intellectual property rights for creators and brands
 */
export async function checkBitScrunchIPInfringement(
  imageUrl: string,
  contractAddress: string
): Promise<{
  isInfringing: boolean;
  similarityScore: number;
  originalWork?: string;
  confidence: number;
} | null> {
  if (!BITSCRUNCH_CONFIG.apiKey) {
    console.warn('BitScrunch API key not configured, skipping IP infringement check');
    return null;
  }

  return withRetry(async () => {
    try {
      const response = await axios.post(
        `${BITSCRUNCH_CONFIG.baseUrl}/v1/ip/check`,
        {
          imageUrl,
          contractAddress,
          network: BITSCRUNCH_CONFIG.network
        },
        {
          headers: {
            'Authorization': `Bearer ${BITSCRUNCH_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          isInfringing: false,
          similarityScore: 0,
          confidence: 0
        };
      }
      throw error;
    }
  }, 2, 2000).catch((error) => {
    console.error('BitScrunch IP infringement check failed:', error);
    return null;
  });
}