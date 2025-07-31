import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import axios from 'axios';
import {
  getProvider,
  isValidEthereumAddress,
  ERC721_ABI,
  NFTInfo,
  NFTMetadata,
  NFTData,
  fetchNFTMetadata,
  analyzeNFTRisk,
  analyzeBitScrunchTradingPatterns,
  getBitScrunchPriceEstimation,
  checkBitScrunchIPInfringement,
  analyzeBitScrunchWalletBehavior
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
    
    // Create NFT info object
    const nftInfo: NFTInfo = {
      contractAddress,
      tokenId,
      name: metadata?.name || `Token #${tokenId}`,
      description: metadata?.description,
      image: metadata?.image,
      riskLevel,
      riskFactors,
      metadata: metadata || undefined
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
  metadata: NFTMetadata | null,
  tokenURI: string,
  _collectionName: string, // Prefixed with underscore to indicate it's intentionally unused
  owner: string
): Promise<string[]> {
  const riskFactors: string[] = [];

  try {
    console.log('Analyzing NFT risk factors with BitScrunch integration...');

    // Create NFTData object for analysis
    const nftData: NFTData = {
      contractAddress,
      tokenId,
      name: metadata?.name,
      metadata: metadata || undefined
    };

    // Use enhanced BitScrunch-powered risk analysis
    const enhancedRisks = await analyzeNFTRisk(nftData, metadata, contractAddress, tokenId);
    riskFactors.push(...enhancedRisks);

    // Check collection reputation
    const collectionRisks = await analyzeCollectionReputation(contractAddress, _collectionName);
    riskFactors.push(...collectionRisks);

    // Check ownership patterns with BitScrunch wallet behavior analysis
    const ownershipRisks = await analyzeOwnershipPatterns(contractAddress, tokenId, owner);
    riskFactors.push(...ownershipRisks);

    // Use BitScrunch for comprehensive trading pattern analysis
    const tradingRisks = await analyzeTradingPatterns(contractAddress, tokenId);
    riskFactors.push(...tradingRisks);

    // Add BitScrunch IP infringement check if image is available
    if (metadata?.image) {
      try {
        const ipCheck = await checkBitScrunchIPInfringement(metadata.image, contractAddress);
        if (ipCheck?.isInfringing && ipCheck.confidence > 0.7) {
          riskFactors.push(`Potential IP infringement detected (${ipCheck.similarityScore}% similarity)`);
        }
      } catch (error) {
        console.error('IP infringement check failed:', error);
      }
    }

    console.log(`Identified ${riskFactors.length} risk factors for NFT`);

  } catch (error) {
    console.error('Error analyzing NFT risk factors:', error);
    riskFactors.push('Error occurred during risk analysis');
  }

  return riskFactors;
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

    // Use BitScrunch wallet behavior analysis for enhanced insights
    try {
      const walletBehavior = await analyzeBitScrunchWalletBehavior(owner);
      if (walletBehavior) {
        if (walletBehavior.riskScore > 70) {
          risks.push('High-risk wallet owner profile detected');
        }
        
        // Add specific suspicious activities
        if (walletBehavior.suspiciousActivity.length > 0) {
          risks.push(...walletBehavior.suspiciousActivity.map(activity => 
            `Wallet activity: ${activity}`
          ));
        }
        
        // Check for gaming-related activities which might indicate bot behavior
        if (walletBehavior.gamingActivity) {
          risks.push('Wallet shows gaming activity patterns (verify legitimacy)');
        }
      }
    } catch (error) {
      console.error('BitScrunch wallet analysis failed:', error);
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
    console.log('Analyzing trading patterns with BitScrunch forensic capabilities...');
    
    // Use BitScrunch for comprehensive trading pattern analysis
    const tradingPatterns = await analyzeBitScrunchTradingPatterns(contractAddress, tokenId);
    
    if (tradingPatterns) {
      // Check for wash trading
      if (tradingPatterns.washTradingDetected) {
        risks.push('Wash trading patterns detected by BitScrunch AI');
      }
      
      // Check for volume manipulation
      if (tradingPatterns.volumeManipulation) {
        risks.push('Volume manipulation detected');
      }
      
      // Check for price manipulation
      if (tradingPatterns.priceManipulation) {
        risks.push('Price manipulation patterns identified');
      }
      
      // Check for rapid successive transfers
      if (tradingPatterns.rapidSuccessiveTransfers) {
        risks.push('Rapid successive transfers detected (potential pump scheme)');
      }
      
      // Check for suspicious timing patterns
      if (tradingPatterns.suspiciousTimingPatterns) {
        risks.push('Suspicious trading timing patterns detected');
      }
      
      // Check for cross-platform arbitrage
      if (tradingPatterns.crossPlatformArbitrage) {
        risks.push('Cross-platform arbitrage activity detected');
      }
    } else {
      // Fallback analysis when BitScrunch is not available
      console.log('BitScrunch trading analysis not available, using basic pattern detection');
      
      // Basic pattern detection (placeholder for when BitScrunch API is not available)
      // In production, this would analyze recent transactions using blockchain data
      const recentTransactionAnalysis = await analyzeRecentTransactions(contractAddress, tokenId);
      risks.push(...recentTransactionAnalysis);
    }
    
    // Get BitScrunch price estimation for additional insights
    try {
      const priceEstimation = await getBitScrunchPriceEstimation(contractAddress, tokenId);
      if (priceEstimation) {
        if (priceEstimation.confidence < 0.3) {
          risks.push('Low price estimation confidence - market may be manipulated');
        }
        
        if (priceEstimation.methodology === 'insufficient_data') {
          risks.push('Insufficient trading data for reliable price estimation');
        }
      }
    } catch (error) {
      console.error('Price estimation failed:', error);
    }
    
  } catch (error) {
    console.error('Error analyzing trading patterns:', error);
    risks.push('Unable to complete comprehensive trading pattern analysis');
  }
  
  return risks;
}

interface TransactionData {
  tokenID: string;
  from: string;
  to: string;
  timeStamp: string;
  [key: string]: unknown;
}

// Basic transaction analysis fallback function
async function analyzeRecentTransactions(
  contractAddress: string,
  tokenId: string
): Promise<string[]> {
  const risks: string[] = [];
  
  try {
    // This would ideally use Etherscan API or similar to get recent transactions
    // For now, we'll implement basic checks that can be done with available data
    
    if (process.env.ETHERSCAN_API_KEY) {
      // Get recent transactions for this NFT contract
      try {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&page=1&offset=100&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`,
          { timeout: 10000 }
        );
        
        if (response.data.result) {
          const transactions = response.data.result.filter((tx: TransactionData) => tx.tokenID === tokenId);
          
          // Analyze transaction patterns
          if (transactions.length > 10) {
            const recentTxs = transactions.slice(0, 10);
            const uniqueAddresses = new Set();
            let rapidTransfers = 0;
            
            for (let i = 0; i < recentTxs.length - 1; i++) {
              uniqueAddresses.add(recentTxs[i].from);
              uniqueAddresses.add(recentTxs[i].to);
              
              // Check for rapid transfers (within 24 hours)
              const timeDiff = parseInt(recentTxs[i].timeStamp) - parseInt(recentTxs[i + 1].timeStamp);
              if (timeDiff < 86400) { // 24 hours
                rapidTransfers++;
              }
            }
            
            // Check for potential wash trading indicators
            if (uniqueAddresses.size < transactions.length * 0.5) {
              risks.push('Limited unique addresses in recent transactions (potential wash trading)');
            }
            
            if (rapidTransfers > 3) {
              risks.push('Multiple rapid transfers detected (potential market manipulation)');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error);
      }
    }
    
  } catch (error) {
    console.error('Error in basic transaction analysis:', error);
  }
  
  return risks;
}