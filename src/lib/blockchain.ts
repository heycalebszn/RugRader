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
  return new ethers.JsonRpcProvider(rpcUrl);
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

// External API helpers
export async function fetchTokenPrice(tokenAddress: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`,
      {
        headers: process.env.COINGECKO_API_KEY ? {
          'X-CG-API-KEY': process.env.COINGECKO_API_KEY
        } : {}
      }
    );
    
    return response.data[tokenAddress.toLowerCase()]?.usd || null;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return null;
  }
}

export async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  try {
    // Handle IPFS URLs
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    const response = await axios.get(url, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

// Known risky token addresses (example list - in production, this would be a comprehensive database)
export const KNOWN_RISKY_TOKENS = new Set([
  '0x...', // Add known scam token addresses
]);

// Known safe token addresses
export const KNOWN_SAFE_TOKENS = new Set([
  '0xa0b86a33e6441e78ca8e27d0e7c8b1c8b8b8b8b8', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
]);

export function analyzeTokenRisk(tokenAddress: string, tokenInfo: any): string[] {
  const riskFactors: string[] = [];
  
  if (KNOWN_RISKY_TOKENS.has(tokenAddress.toLowerCase())) {
    riskFactors.push('Known scam token');
  }
  
  // Add more risk analysis logic here
  if (tokenInfo.name && tokenInfo.name.toLowerCase().includes('test')) {
    riskFactors.push('Test token detected');
  }
  
  return riskFactors;
}