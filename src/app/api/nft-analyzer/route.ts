import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import axios from 'axios';
import {
  getProvider,
  isValidEthereumAddress,
  ERC721_ABI,
  NFTInfo,
  fetchNFTMetadata,
  analyzeNFTRisk
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

    console.log(`Starting NFT analysis for ${contractAddress}:${tokenId}`);

    // Get real blockchain data
    const provider = getProvider();
    
    // Analyze the specific NFT
    const nftInfo = await analyzeNFT(provider, contractAddress, tokenId);

    console.log(`NFT analysis complete for: ${nftInfo.name}`);
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
  provider: ethers.JsonRpcProvider, 
  contractAddress: string, 
  tokenId: string
): Promise<NFTInfo> {
  try {
    console.log('Getting NFT data from blockchain...');
    
    // Get real blockchain data
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    
    let owner = '';
    let tokenURI = '';
    let collectionName = 'Unknown Collection';
    
    try {
      // Get basic NFT info from blockchain
      [owner, tokenURI, collectionName] = await Promise.all([
        contract.ownerOf(tokenId).catch(() => ''),
        contract.tokenURI(tokenId).catch(() => ''),
        contract.name().catch(() => 'Unknown Collection')
      ]);
      
      console.log(`Owner: ${owner}, Collection: ${collectionName}`);
    } catch (error) {
      console.error('Error getting basic NFT info:', error);
      throw new Error('NFT not found or invalid token ID');
    }

    // Fetch and analyze metadata
    console.log('Fetching NFT metadata...');
    const metadata = await fetchNFTMetadata(tokenURI);
    
    // Analyze risk factors
    const riskFactors = await analyzeNFTRiskFactors(
      contractAddress, 
      tokenId, 
      metadata, 
      tokenURI,
      collectionName,
      owner
    );
    
    // Determine risk level
    const riskLevel = riskFactors.length >= 3 ? 'high' : 
                     riskFactors.length >= 1 ? 'medium' : 'low';

    // Check if collection is verified
    const isVerified = await isCollectionVerified(contractAddress, collectionName);

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
        verified: isVerified,
        lastAnalyzed: new Date().toISOString(),
        attributes: metadata?.attributes || metadata?.traits || []
      }
    };

    return nftInfo;

  } catch (error) {
    console.error('Error analyzing NFT:', error);
    
    // Return error info instead of mock data
    return {
      contractAddress,
      tokenId,
      name: `Analysis Failed - Token #${tokenId}`,
      description: 'Unable to analyze this NFT. It may not exist or the contract may be invalid.',
      riskLevel: 'high',
      riskFactors: ['NFT analysis failed', 'Token may not exist or be invalid'],
      metadata: {
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastAnalyzed: new Date().toISOString()
      }
    };
  }
}

async function analyzeNFTRiskFactors(
  contractAddress: string,
  tokenId: string,
  metadata: any,
  tokenURI: string,
  collectionName: string,
  owner: string
): Promise<string[]> {
  const riskFactors: string[] = [];

  try {
    console.log('Analyzing NFT risk factors...');

    // Check metadata validity and integrity
    if (!metadata) {
      riskFactors.push('Metadata not accessible or missing');
    } else {
      // Check for incomplete metadata
      if (!metadata.name && !metadata.description) {
        riskFactors.push('Incomplete metadata (missing name and description)');
      }
      
      // Check for suspicious metadata patterns
      if (metadata.name && (
        metadata.name.toLowerCase().includes('test') ||
        metadata.name.toLowerCase().includes('copy') ||
        metadata.name.toLowerCase().includes('fake') ||
        metadata.name.toLowerCase().includes('scam')
      )) {
        riskFactors.push('Suspicious NFT name detected');
      }

      // Check image accessibility
      if (metadata.image) {
        if (!metadata.image.startsWith('https://') && 
            !metadata.image.startsWith('ipfs://') && 
            !metadata.image.startsWith('data:')) {
          riskFactors.push('Potentially inaccessible image URL');
        }
      } else {
        riskFactors.push('No image URL found in metadata');
      }

      // Check for missing or suspicious attributes
      if (!metadata.attributes && !metadata.traits) {
        riskFactors.push('No attributes/traits found');
      }
    }

    // Check token URI validity
    if (!tokenURI || tokenURI === '') {
      riskFactors.push('Missing or empty token URI');
    } else {
      if (tokenURI.startsWith('data:')) {
        // Data URIs might indicate on-chain metadata
        riskFactors.push('On-chain metadata detected (verify authenticity)');
      } else if (!tokenURI.startsWith('https://') && !tokenURI.startsWith('ipfs://')) {
        riskFactors.push('Suspicious token URI format');
      }

      // Check for centralized hosting concerns
      if (tokenURI.includes('localhost') || tokenURI.includes('127.0.0.1')) {
        riskFactors.push('Metadata hosted on localhost (will not be accessible)');
      }
    }

    // Check collection reputation
    const collectionRisks = await analyzeCollectionReputation(contractAddress, collectionName);
    riskFactors.push(...collectionRisks);

    // Check ownership patterns
    const ownershipRisks = await analyzeOwnershipPatterns(contractAddress, tokenId, owner);
    riskFactors.push(...ownershipRisks);

    // Check for potential wash trading or suspicious activity
    const tradingRisks = await analyzeTradingPatterns(contractAddress, tokenId);
    riskFactors.push(...tradingRisks);

    console.log(`Identified ${riskFactors.length} risk factors for NFT`);

  } catch (error) {
    console.error('Error analyzing NFT risk factors:', error);
    riskFactors.push('Error occurred during risk analysis');
  }

  return riskFactors;
}

async function isCollectionVerified(contractAddress: string, collectionName: string): Promise<boolean> {
  try {
    // Check against known verified collections
    const knownVerifiedCollections = new Set([
      '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
      '0x60e4d786628fea6478f785a6d7e704777c86a7c6', // MAYC
      '0xed5af388653567af2f388e6224dc7c4b3241c544', // Azuki
      '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e', // Doodles
      '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b', // CloneX
      '0x23581767a106ae21c074b2276d25e5c3e136a68b', // Moonbirds
      '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258', // Otherdeeds
      '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85', // ENS
    ]);
    
    if (knownVerifiedCollections.has(contractAddress.toLowerCase())) {
      return true;
    }

    // Check contract verification on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      try {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`,
          { timeout: 10000 }
        );
        
        if (response.data.result?.[0]?.SourceCode !== '') {
          return true; // Contract is verified
        }
      } catch (error) {
        console.error('Error checking contract verification:', error);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking collection verification:', error);
    return false;
  }
}

async function analyzeCollectionReputation(
  contractAddress: string, 
  collectionName: string
): Promise<string[]> {
  const risks: string[] = [];
  
  try {
    // Check for copycat indicators
    if (collectionName.toLowerCase().includes('clone') || 
        collectionName.toLowerCase().includes('copy') ||
        collectionName.toLowerCase().includes('fake') ||
        collectionName.toLowerCase().includes('unofficial')) {
      risks.push('Potential copycat or unofficial collection');
    }
    
    // Check for test/demo indicators
    if (collectionName.toLowerCase().includes('test') ||
        collectionName.toLowerCase().includes('demo') ||
        collectionName.toLowerCase().includes('sample')) {
      risks.push('Test or demo collection detected');
    }

    // Check creation date using Etherscan if available
    if (process.env.ETHERSCAN_API_KEY) {
      try {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`,
          { timeout: 10000 }
        );
        
        if (response.data.result?.[0]?.timeStamp) {
          const creationTimestamp = parseInt(response.data.result[0].timeStamp) * 1000;
          const daysSinceCreation = (Date.now() - creationTimestamp) / (1000 * 60 * 60 * 24);
          
          if (daysSinceCreation < 7) {
            risks.push('Very recently created collection (< 7 days)');
          } else if (daysSinceCreation < 30) {
            risks.push('Recently created collection (< 30 days)');
          }
        }
      } catch (error) {
        console.error('Error checking collection creation date:', error);
      }
    }
    
  } catch (error) {
    console.error('Error analyzing collection reputation:', error);
  }
  
  return risks;
}

async function analyzeOwnershipPatterns(
  contractAddress: string,
  tokenId: string,
  owner: string
): Promise<string[]> {
  const risks: string[] = [];
  
  try {
    // Check if owner is a known problematic address (this would be a database lookup in production)
    const knownProblematicAddresses = new Set([
      '0x0000000000000000000000000000000000000000', // Null address
      // Add known scammer addresses here
    ]);
    
    if (knownProblematicAddresses.has(owner.toLowerCase())) {
      risks.push('NFT owned by flagged address');
    }

    // Check if owner is a contract (might indicate automated trading or custody)
    if (owner && owner !== '') {
      try {
        const provider = getProvider();
        const code = await provider.getCode(owner);
        if (code !== '0x') {
          risks.push('NFT owned by smart contract (verify legitimacy)');
        }
      } catch (error) {
        console.error('Error checking owner contract status:', error);
      }
    }
    
  } catch (error) {
    console.error('Error analyzing ownership patterns:', error);
  }
  
  return risks;
}

async function analyzeTradingPatterns(
  contractAddress: string, 
  tokenId: string
): Promise<string[]> {
  const risks: string[] = [];
  
  try {
    // In a production environment, this would analyze trading history
    // For now, we'll implement basic checks that can be done with available data
    
    // Check if this is a recently minted token (would require more complex analysis)
    // This is a placeholder for more sophisticated trading pattern analysis
    
    console.log('Trading pattern analysis would require historical transaction data');
    
  } catch (error) {
    console.error('Error analyzing trading patterns:', error);
  }
  
  return risks;
}