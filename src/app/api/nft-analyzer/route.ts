import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  getProvider,
  isValidEthereumAddress,
  ERC721_ABI,
  NFTInfo,
  fetchNFTMetadata
} from '@/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, tokenId } = await request.json();

    // Validate input
    if (!contractAddress || !isValidEthereumAddress(contractAddress)) {
      return NextResponse.json(
        { error: 'Invalid contract address provided' },
        { status: 400 }
      );
    }

    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json(
        { error: 'Invalid token ID provided' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll use mock data initially
    // const provider = getProvider();
    
    // Analyze the specific NFT
    const nftInfo = await analyzeNFT(null, contractAddress, tokenId);

    return NextResponse.json(nftInfo);

  } catch (error) {
    console.error('NFT analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze NFT. Please try again.' },
      { status: 500 }
    );
  }
}

async function analyzeNFT(
  provider: ethers.JsonRpcProvider | null, 
  contractAddress: string, 
  tokenId: string
): Promise<NFTInfo> {
  try {
    // For demo, we'll use mock data instead of real blockchain calls
    // const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    
    // Mock basic info (in production, get from blockchain)
    let owner = '0x1234567890abcdef1234567890abcdef12345678';
    let tokenURI = 'https://example.com/token/metadata.json';
    let collectionName = 'Demo Collection';
    
    // In production, uncomment these lines:
    // try {
    //   owner = await contract.ownerOf(tokenId);
    //   tokenURI = await contract.tokenURI(tokenId);
    //   collectionName = await contract.name();
    // } catch (error) {
    //   throw new Error('NFT not found or invalid token ID');
    // }

    // Fetch and analyze metadata
    const metadata = await fetchNFTMetadata(tokenURI);
    
    // Analyze risk factors
    const riskFactors = await analyzeNFTRiskFactors(
      contractAddress, 
      tokenId, 
      metadata, 
      tokenURI,
      collectionName
    );
    
    // Determine risk level
    const riskLevel = riskFactors.length >= 3 ? 'high' : 
                     riskFactors.length >= 1 ? 'medium' : 'low';

    const nftInfo: NFTInfo = {
      contractAddress,
      tokenId,
      name: metadata?.name || `${collectionName} #${tokenId}`,
      description: metadata?.description || 'No description available',
      image: metadata?.image || metadata?.image_url,
      riskLevel,
      riskFactors,
      metadata: {
        ...metadata,
        owner,
        tokenURI,
        collection: collectionName,
        verified: await isCollectionVerified(contractAddress),
        lastAnalyzed: new Date().toISOString()
      }
    };

    return nftInfo;

  } catch (error) {
    console.error('Error analyzing NFT:', error);
    
    // Return mock data for demonstration if real analysis fails
    return {
      contractAddress,
      tokenId,
      name: `Demo NFT #${tokenId}`,
      description: 'This is a demonstration NFT analysis',
      riskLevel: 'low',
      riskFactors: [],
      metadata: {
        verified: true,
        collection: 'Demo Collection',
        lastAnalyzed: new Date().toISOString(),
        analysisNote: 'Real blockchain analysis failed, showing demo data'
      }
    };
  }
}

async function analyzeNFTRiskFactors(
  contractAddress: string,
  tokenId: string,
  metadata: any,
  tokenURI: string,
  collectionName: string
): Promise<string[]> {
  const riskFactors: string[] = [];

  // Check metadata validity
  if (!metadata) {
    riskFactors.push('Metadata not accessible');
  } else {
    // Check for suspicious metadata patterns
    if (!metadata.name && !metadata.description) {
      riskFactors.push('Incomplete metadata');
    }
    
    if (metadata.name && metadata.name.toLowerCase().includes('test')) {
      riskFactors.push('Test NFT detected');
    }
  }

  // Check token URI validity
  if (!tokenURI || tokenURI === '') {
    riskFactors.push('Missing token URI');
  } else if (tokenURI.startsWith('data:')) {
    // Data URIs might indicate on-chain metadata (could be good or bad)
    riskFactors.push('On-chain metadata (verify authenticity)');
  } else if (!tokenURI.startsWith('https://') && !tokenURI.startsWith('ipfs://')) {
    riskFactors.push('Suspicious metadata source');
  }

  // Check collection reputation (mock analysis)
  const collectionRisk = await analyzeCollectionReputation(contractAddress, collectionName);
  riskFactors.push(...collectionRisk);

  // Check for wash trading patterns (mock analysis)
  const tradingRisk = await analyzeTradingPatterns(contractAddress, tokenId);
  riskFactors.push(...tradingRisk);

  return riskFactors;
}

async function isCollectionVerified(contractAddress: string): Promise<boolean> {
  // In production, this would check against verified collection databases
  // For demo, we'll use some heuristics
  
  const knownCollections = new Set([
    '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
    '0x60e4d786628fea6478f785a6d7e704777c86a7c6', // MAYC
    '0xed5af388653567af2f388e6224dc7c4b3241c544', // Azuki
  ]);
  
  return knownCollections.has(contractAddress.toLowerCase());
}

async function analyzeCollectionReputation(
  contractAddress: string, 
  collectionName: string
): Promise<string[]> {
  const risks: string[] = [];
  
  // Mock reputation analysis
  if (collectionName.toLowerCase().includes('clone') || 
      collectionName.toLowerCase().includes('copy')) {
    risks.push('Potential copycat collection');
  }
  
  // Check creation date (mock)
  const random = Math.random();
  if (random > 0.8) {
    risks.push('Recently created collection (< 30 days)');
  }
  
  return risks;
}

async function analyzeTradingPatterns(
  contractAddress: string, 
  tokenId: string
): Promise<string[]> {
  const risks: string[] = [];
  
  // Mock trading pattern analysis
  const random = Math.random();
  
  if (random > 0.9) {
    risks.push('Suspicious trading velocity detected');
  }
  
  if (random > 0.8) {
    risks.push('Potential wash trading activity');
  }
  
  if (random > 0.7) {
    risks.push('Price manipulation indicators');
  }
  
  return risks;
}