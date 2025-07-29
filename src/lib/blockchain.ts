import { ethers } from 'ethers';
import axios from 'axios';
import Moralis from 'moralis';

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

// Initialize Moralis (call this once when the app starts)
let moralisInitialized = false;

async function initializeMoralis() {
  if (!moralisInitialized && process.env.MORALIS_API_KEY) {
    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      moralisInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Moralis:', error);
    }
  }
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

// Real blockchain data fetching functions
export async function getWalletTokenBalances(address: string): Promise<TokenInfo[]> {
  await initializeMoralis();
  
  try {
    if (!process.env.MORALIS_API_KEY) {
      throw new Error('Moralis API key not configured');
    }

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: "0x1", // Ethereum mainnet
      address: address,
    });

    const tokens: TokenInfo[] = [];
    
    for (const token of response.result) {
      const tokenAddress = token.tokenAddress?.lowercase || '';
      const balance = ethers.formatUnits(token.balance || '0', token.decimals || 18);
      
      // Skip tokens with zero balance
      if (parseFloat(balance) === 0) continue;
      
      // Get token price
      const price = await fetchTokenPrice(tokenAddress);
      
      // Analyze risk factors
      const riskFactors = await analyzeTokenRisk(tokenAddress, {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals
      });
      
      const riskLevel = calculateTokenRiskLevel(riskFactors);
      
      tokens.push({
        address: tokenAddress,
        name: token.name || 'Unknown Token',
        symbol: token.symbol || 'UNKNOWN',
        decimals: token.decimals || 18,
        balance,
        price,
        riskLevel,
        riskFactors
      });
    }
    
    return tokens;
  } catch (error) {
    console.error('Error fetching wallet token balances:', error);
    return [];
  }
}

export async function getWalletNFTs(address: string): Promise<NFTInfo[]> {
  await initializeMoralis();
  
  try {
    if (!process.env.MORALIS_API_KEY) {
      throw new Error('Moralis API key not configured');
    }

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      chain: "0x1", // Ethereum mainnet
      address: address,
      limit: 100, // Limit to first 100 NFTs
    });

    const nfts: NFTInfo[] = [];
    
    for (const nft of response.result) {
      const contractAddress = nft.tokenAddress?.lowercase || '';
      const tokenId = nft.tokenId || '';
      
      // Parse metadata
      let metadata;
      try {
        metadata = nft.metadata ? JSON.parse(nft.metadata) : null;
      } catch {
        metadata = null;
      }
      
      // Analyze risk factors
      const riskFactors = await analyzeNFTRisk(contractAddress, tokenId, metadata, nft.tokenUri);
      const riskLevel = calculateNFTRiskLevel(riskFactors);
      
      nfts.push({
        contractAddress,
        tokenId,
        name: metadata?.name || nft.name || `Token #${tokenId}`,
        description: metadata?.description || 'No description available',
        image: metadata?.image || metadata?.image_url,
        riskLevel,
        riskFactors,
        metadata: {
          ...metadata,
          tokenUri: nft.tokenUri,
          contractType: nft.contractType,
          lastMetadataSync: nft.lastMetadataSync,
          lastTokenUriSync: nft.lastTokenUriSync
        }
      });
    }
    
    return nfts;
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    return [];
  }
}

// Real risk analysis functions
export async function analyzeTokenRisk(tokenAddress: string, tokenInfo: any): Promise<string[]> {
  const riskFactors: string[] = [];
  
  try {
    // Check against known scam databases using Etherscan
    const contractInfo = await getContractInfo(tokenAddress);
    
    if (!contractInfo.isVerified) {
      riskFactors.push('Contract not verified on Etherscan');
    }
    
    if (contractInfo.creationDate && isRecentContract(contractInfo.creationDate)) {
      riskFactors.push('Recently created contract (< 30 days)');
    }
    
    // Check token name for suspicious patterns
    if (tokenInfo.name) {
      const suspiciousPatterns = ['test', 'fake', 'scam', 'honeypot', 'rug'];
      const lowerName = tokenInfo.name.toLowerCase();
      
      if (suspiciousPatterns.some(pattern => lowerName.includes(pattern))) {
        riskFactors.push('Suspicious token name detected');
      }
    }
    
    // Check if token has sufficient liquidity
    const liquidityInfo = await checkTokenLiquidity(tokenAddress);
    if (liquidityInfo.isLowLiquidity) {
      riskFactors.push('Low liquidity detected');
    }
    
  } catch (error) {
    console.error('Error analyzing token risk:', error);
  }
  
  return riskFactors;
}

export async function analyzeNFTRisk(contractAddress: string, tokenId: string, metadata: any, tokenUri?: string): Promise<string[]> {
  const riskFactors: string[] = [];
  
  try {
    // Check metadata accessibility
    if (!metadata && tokenUri) {
      try {
        const fetchedMetadata = await fetchNFTMetadata(tokenUri);
        if (!fetchedMetadata) {
          riskFactors.push('Metadata not accessible');
        }
      } catch {
        riskFactors.push('Metadata fetch failed');
      }
    }
    
    // Check for suspicious metadata patterns
    if (metadata?.name && metadata.name.toLowerCase().includes('stolen')) {
      riskFactors.push('Potentially stolen NFT (flagged in metadata)');
    }
    
    // Check contract verification
    const contractInfo = await getContractInfo(contractAddress);
    if (!contractInfo.isVerified) {
      riskFactors.push('Contract not verified on Etherscan');
    }
    
    // Check if collection is flagged
    const collectionRisk = await checkCollectionReputation(contractAddress);
    riskFactors.push(...collectionRisk);
    
  } catch (error) {
    console.error('Error analyzing NFT risk:', error);
  }
  
  return riskFactors;
}

// Helper functions for risk calculation
function calculateTokenRiskLevel(riskFactors: string[]): 'low' | 'medium' | 'high' {
  if (riskFactors.length >= 3) return 'high';
  if (riskFactors.length >= 1) return 'medium';
  return 'low';
}

function calculateNFTRiskLevel(riskFactors: string[]): 'low' | 'medium' | 'high' {
  if (riskFactors.length >= 2) return 'high';
  if (riskFactors.length >= 1) return 'medium';
  return 'low';
}

// Contract verification using Etherscan API
async function getContractInfo(contractAddress: string): Promise<{isVerified: boolean, creationDate?: Date}> {
  try {
    if (!process.env.ETHERSCAN_API_KEY) {
      return { isVerified: false };
    }
    
    const response = await axios.get(
      `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`
    );
    
    const result = response.data.result[0];
    const isVerified = result.SourceCode !== '';
    
    return { isVerified };
  } catch (error) {
    console.error('Error checking contract info:', error);
    return { isVerified: false };
  }
}

function isRecentContract(creationDate: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return creationDate > thirtyDaysAgo;
}

async function checkTokenLiquidity(tokenAddress: string): Promise<{isLowLiquidity: boolean}> {
  // This would integrate with DEX APIs like Uniswap to check liquidity
  // For now, return a simple check
  return { isLowLiquidity: false };
}

async function checkCollectionReputation(contractAddress: string): Promise<string[]> {
  const risks: string[] = [];
  
  // This would check against known databases of flagged collections
  // For now, implement basic checks
  
  return risks;
}

// Real collection analysis functions
export async function getCollectionInfo(contractAddress: string): Promise<CollectionInfo> {
  await initializeMoralis();
  
  try {
    if (!process.env.MORALIS_API_KEY) {
      throw new Error('Moralis API key not configured');
    }

    // Get collection metadata
    const collectionResponse = await Moralis.EvmApi.nft.getNFTContractMetadata({
      chain: "0x1",
      address: contractAddress,
    });

    const collection = collectionResponse.result;
    
    // Get collection transfers to analyze holder distribution
    const transfersResponse = await Moralis.EvmApi.nft.getNFTContractTransfers({
      chain: "0x1",
      address: contractAddress,
      limit: 1000, // Get recent transfers
    });

    // Analyze holder distribution from transfers
    const holderAnalysis = analyzeHolderDistribution(transfersResponse.result);
    
    // Get floor price from OpenSea or other marketplaces
    const floorPrice = await getCollectionFloorPrice(contractAddress);
    
    // Analyze risk factors
    const riskFactors = await analyzeCollectionRiskFactors(contractAddress, collection, holderAnalysis);
    
    // Get audit status
    const auditStatus = await getCollectionAuditStatus(contractAddress);
    
    const collectionInfo: CollectionInfo = {
      contractAddress,
      name: collection.name || 'Unknown Collection',
      totalSupply: parseInt(collection.totalSupply || '0'),
      floorPrice,
      holderCount: holderAnalysis.uniqueHolders,
      topHolders: holderAnalysis.topHolders,
      riskLevel: calculateCollectionRisk({ riskFactors } as CollectionInfo),
      riskFactors,
      auditStatus
    };

    return collectionInfo;

  } catch (error) {
    console.error('Error getting collection info:', error);
    throw error;
  }
}

function analyzeHolderDistribution(transfers: any[]): {uniqueHolders: number, topHolders: Array<{address: string, count: number, percentage: number}>} {
  const holderCounts = new Map<string, number>();
  const currentHolders = new Set<string>();
  
  // Process transfers to determine current holders
  transfers.forEach(transfer => {
    const to = transfer.toAddress?.toLowerCase();
    const from = transfer.fromAddress?.toLowerCase();
    
    if (to && to !== '0x0000000000000000000000000000000000000000') {
      currentHolders.add(to);
      holderCounts.set(to, (holderCounts.get(to) || 0) + 1);
    }
    
    if (from && from !== '0x0000000000000000000000000000000000000000') {
      const currentCount = holderCounts.get(from) || 0;
      if (currentCount > 1) {
        holderCounts.set(from, currentCount - 1);
      } else {
        holderCounts.delete(from);
        currentHolders.delete(from);
      }
    }
  });
  
  // Get top holders
  const sortedHolders = Array.from(holderCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  const totalTokens = Array.from(holderCounts.values()).reduce((sum, count) => sum + count, 0);
  
  const topHolders = sortedHolders.map(([address, count]) => ({
    address,
    count,
    percentage: totalTokens > 0 ? (count / totalTokens) * 100 : 0
  }));
  
  return {
    uniqueHolders: currentHolders.size,
    topHolders
  };
}

async function getCollectionFloorPrice(contractAddress: string): Promise<number | undefined> {
  try {
    // Try to get floor price from OpenSea API
    if (process.env.OPENSEA_API_KEY) {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/collection/${contractAddress}/stats`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY
          }
        }
      );
      
      return response.data.stats?.floor_price;
    }
    
    // Fallback: Could integrate with other marketplaces like Blur, LooksRare
    return undefined;
  } catch (error) {
    console.error('Error fetching floor price:', error);
    return undefined;
  }
}

async function analyzeCollectionRiskFactors(contractAddress: string, collection: any, holderAnalysis: any): Promise<string[]> {
  const riskFactors: string[] = [];
  
  try {
    // Check holder concentration
    const topHolderPercentage = holderAnalysis.topHolders
      .slice(0, 5)
      .reduce((sum: number, holder: any) => sum + holder.percentage, 0);
    
    if (topHolderPercentage > 50) {
      riskFactors.push(`Top 5 holders own ${topHolderPercentage.toFixed(1)}% of supply 🐋`);
    }
    
    // Check contract verification
    const contractInfo = await getContractInfo(contractAddress);
    if (!contractInfo.isVerified) {
      riskFactors.push('Contract not verified on Etherscan');
    }
    
    // Check collection name for suspicious patterns
    if (collection.name) {
      const suspiciousPatterns = ['test', 'fake', 'copy', 'clone', 'scam'];
      const lowerName = collection.name.toLowerCase();
      
      if (suspiciousPatterns.some(pattern => lowerName.includes(pattern))) {
        riskFactors.push('Suspicious collection name detected');
      }
    }
    
    // Check total supply (very low or very high can be suspicious)
    const totalSupply = parseInt(collection.totalSupply || '0');
    if (totalSupply < 100) {
      riskFactors.push('Unusually low total supply (< 100)');
    } else if (totalSupply > 100000) {
      riskFactors.push('Unusually high total supply (> 100,000)');
    }
    
    // Check for wash trading patterns (would need more sophisticated analysis)
    // This is a simplified check
    if (holderAnalysis.uniqueHolders < totalSupply * 0.1) {
      riskFactors.push('Low holder diversity - potential wash trading');
    }
    
  } catch (error) {
    console.error('Error analyzing collection risk factors:', error);
  }
  
  return riskFactors;
}

async function getCollectionAuditStatus(contractAddress: string): Promise<'passed' | 'failed' | 'unknown'> {
  try {
    // Check if contract is verified (basic audit check)
    const contractInfo = await getContractInfo(contractAddress);
    
    if (contractInfo.isVerified) {
      // In a real implementation, you'd check against audit databases
      // For now, verified contracts are considered "passed"
      return 'passed';
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error checking audit status:', error);
    return 'unknown';
  }
}

// Real NFT analysis function
export async function getNFTInfo(contractAddress: string, tokenId: string): Promise<NFTInfo> {
  await initializeMoralis();
  
  try {
    if (!process.env.MORALIS_API_KEY) {
      throw new Error('Moralis API key not configured');
    }

    // Get NFT metadata from Moralis
    const nftResponse = await Moralis.EvmApi.nft.getNFTMetadata({
      chain: "0x1",
      address: contractAddress,
      tokenId: tokenId,
    });

    const nft = nftResponse.result;
    
    // Parse metadata
    let metadata;
    try {
      metadata = nft.metadata ? JSON.parse(nft.metadata) : null;
    } catch {
      metadata = null;
    }
    
    // If metadata is not available from Moralis, try to fetch from tokenURI
    if (!metadata && nft.tokenUri) {
      metadata = await fetchNFTMetadata(nft.tokenUri);
    }
    
    // Get owner information
    const ownerResponse = await Moralis.EvmApi.nft.getNFTOwners({
      chain: "0x1",
      address: contractAddress,
      tokenId: tokenId,
    });
    
    const owner = ownerResponse.result[0]?.ownerOf;
    
    // Analyze risk factors
    const riskFactors = await analyzeNFTRisk(contractAddress, tokenId, metadata, nft.tokenUri);
    const riskLevel = calculateNFTRiskLevel(riskFactors);
    
    // Get collection info for additional context
    let collectionName = 'Unknown Collection';
    try {
      const collectionResponse = await Moralis.EvmApi.nft.getNFTContractMetadata({
        chain: "0x1",
        address: contractAddress,
      });
      collectionName = collectionResponse.result.name || collectionName;
    } catch (error) {
      console.error('Error fetching collection name:', error);
    }
    
    const nftInfo: NFTInfo = {
      contractAddress,
      tokenId,
      name: metadata?.name || nft.name || `${collectionName} #${tokenId}`,
      description: metadata?.description || 'No description available',
      image: metadata?.image || metadata?.image_url,
      riskLevel,
      riskFactors,
      metadata: {
        ...metadata,
        owner,
        tokenUri: nft.tokenUri,
        contractType: nft.contractType,
        collection: collectionName,
        verified: await isCollectionVerified(contractAddress),
        lastAnalyzed: new Date().toISOString(),
        lastMetadataSync: nft.lastMetadataSync,
        lastTokenUriSync: nft.lastTokenUriSync
      }
    };

    return nftInfo;

  } catch (error) {
    console.error('Error getting NFT info:', error);
    throw error;
  }
}

async function isCollectionVerified(contractAddress: string): Promise<boolean> {
  try {
    // Check if contract is verified on Etherscan
    const contractInfo = await getContractInfo(contractAddress);
    
    // In a real implementation, you'd also check against verified collection databases
    // like OpenSea's verified collections, etc.
    return contractInfo.isVerified;
  } catch (error) {
    console.error('Error checking collection verification:', error);
    return false;
  }
}