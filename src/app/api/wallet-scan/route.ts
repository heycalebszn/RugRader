import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  getProvider,
  isValidEthereumAddress,
  formatEther,
  ERC20_ABI,
  TokenInfo,
  NFTInfo,
  NFTMetadata,
  NFTData as BlockchainNFTData,
  WalletAnalysis,
  calculateWalletRiskScore,
  analyzeTokenRisk,
  analyzeNFTRisk,
  fetchTokenPrice,
  getWalletTokens,
  getWalletNFTs,
  fetchNFTMetadata,
  KNOWN_SAFE_TOKENS,
  analyzeBitScrunchWalletBehavior
} from '@/lib/blockchain';

interface ExternalNFTData {
  token_address?: string;
  contract?: {
    address: string;
  };
  token_id?: string;
  tokenId?: string;
  metadata?: NFTMetadata;
  token_uri?: string;
  name?: string;
  description?: string;
  collection?: {
    name?: string;
    verified?: boolean;
  };
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    // Validate input
    if (!address || !isValidEthereumAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address provided' },
        { status: 400 }
      );
    }

    console.log(`Starting wallet analysis for address: ${address}`);

    // Get real blockchain data
    const provider = getProvider();
    const ethBalance = await provider.getBalance(address);
    const ethBalanceFormatted = formatEther(ethBalance);
    
    console.log(`ETH Balance: ${ethBalanceFormatted} ETH`);
    
    // Analyze tokens and NFTs in the wallet using real data
    const tokens = await analyzeWalletTokens(provider, address);
    const nfts = await analyzeWalletNFTs(provider, address);

    // Calculate risk score
    const riskScore = calculateWalletRiskScore(tokens, nfts);
    const riskLevel = riskScore >= 10 ? 'high' : riskScore >= 5 ? 'medium' : 'low';

    // Generate summary
    const riskyTokens = tokens.filter(t => t.riskLevel === 'high' || t.riskLevel === 'medium');
    const riskyNFTs = nfts.filter(n => n.riskLevel === 'high' || n.riskLevel === 'medium');
    
    let summary = `Wallet analysis complete. `;
    if (riskyTokens.length > 0 || riskyNFTs.length > 0) {
      summary += `Found ${riskyTokens.length} risky tokens and ${riskyNFTs.length} flagged NFTs. `;
    } else {
      summary += `No significant risks detected. `;
    }
    summary += `Overall risk level: ${riskLevel.toUpperCase()}.`;

    const analysis: WalletAnalysis = {
      address,
      ethBalance: ethBalanceFormatted,
      tokens,
      nfts,
      riskScore,
      riskLevel,
      summary
    };

    console.log(`Analysis complete. Found ${tokens.length} tokens and ${nfts.length} NFTs`);
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Wallet scan error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze wallet. Please try again.' },
      { status: 500 }
    );
  }
}

async function analyzeWalletTokens(provider: ethers.JsonRpcProvider, walletAddress: string): Promise<TokenInfo[]> {
  const tokens: TokenInfo[] = [];
  
  try {
    console.log('Fetching wallet tokens...');
    
    // First try to get tokens from external APIs (Moralis/Alchemy)
    const externalTokens = await getWalletTokens(walletAddress);
    
    if (externalTokens.length > 0) {
      console.log(`Found ${externalTokens.length} tokens from external API`);
      
      for (const tokenData of externalTokens.slice(0, 20)) { // Limit to first 20 tokens
        try {
          // Type guard to ensure tokenData has the expected properties
          if (typeof tokenData !== 'object' || tokenData === null) continue;
          
          const tokenAddress = ('token_address' in tokenData ? tokenData.token_address : tokenData.contractAddress) as string;
          if (!tokenAddress) continue;

          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          
          // Get token details with proper type checking
          const [name, symbol, decimals] = await Promise.all([
            contract.name().catch(() => ('name' in tokenData ? tokenData.name : 'Unknown') as string),
            contract.symbol().catch(() => ('symbol' in tokenData ? tokenData.symbol : 'UNK') as string),
            contract.decimals().catch(() => ('decimals' in tokenData ? tokenData.decimals : 18) as number)
          ]);

          // Format balance with proper type checking
          let balance = '0';
          if ('balance' in tokenData && typeof tokenData.balance === 'string') {
            balance = tokenData.balance;
          } else if ('value' in tokenData && typeof tokenData.value === 'string') {
            balance = tokenData.value;
          }
          const formattedBalance = ethers.formatUnits(balance, decimals);
          
          if (parseFloat(formattedBalance) > 0) {
            // Analyze risk factors
            const riskFactors = analyzeTokenRisk(tokenAddress, { name, symbol });
            const riskLevel = KNOWN_SAFE_TOKENS.has(tokenAddress.toLowerCase()) ? 'low' : 
                             riskFactors.length >= 2 ? 'high' : 
                             riskFactors.length >= 1 ? 'medium' : 'low';

            // Try to get price data
            const price = await fetchTokenPrice(tokenAddress);

            tokens.push({
              address: tokenAddress,
              name,
              symbol,
              decimals,
              balance: formattedBalance,
              price: price === null ? undefined : price,
              riskLevel,
              riskFactors
            });

            console.log(`Added token: ${symbol} (${formattedBalance})`);
          }
        } catch (error) {
          console.error(`Error analyzing token:`, error);
          continue;
        }
      }
    } else {
      // Fallback: Check some common tokens manually
      console.log('No external API data available, checking common tokens...');
      const commonTokens = [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0xA0b86a33E6441E78ca8E27d0e7C8b1c8B8b8b8b8', // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      ];

      for (const tokenAddress of commonTokens) {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await contract.balanceOf(walletAddress);
          
          if (balance > BigInt(0)) {
            const [name, symbol, decimals] = await Promise.all([
              contract.name(),
              contract.symbol(),
              contract.decimals()
            ]);
            
            const formattedBalance = ethers.formatUnits(balance, decimals);
            
            // Analyze risk factors
            const riskFactors = analyzeTokenRisk(tokenAddress, { name, symbol });
            const riskLevel = KNOWN_SAFE_TOKENS.has(tokenAddress.toLowerCase()) ? 'low' : 
                             riskFactors.length >= 2 ? 'high' : 
                             riskFactors.length >= 1 ? 'medium' : 'low';

            // Try to get price data
            const price = await fetchTokenPrice(tokenAddress);

            tokens.push({
              address: tokenAddress,
              name,
              symbol,
              decimals,
              balance: formattedBalance,
              price: price === null ? undefined : price,
              riskLevel,
              riskFactors
            });

            console.log(`Found common token: ${symbol} (${formattedBalance})`);
          }
        } catch (error) {
          console.error(`Error checking common token ${tokenAddress}:`, error);
          continue;
        }
      }
    }

  } catch (error) {
    console.error('Error analyzing wallet tokens:', error);
  }

  return tokens;
}

async function analyzeWalletNFTs(provider: ethers.JsonRpcProvider, walletAddress: string): Promise<NFTInfo[]> {
  const nfts: NFTInfo[] = [];
  
  try {
    console.log('Fetching wallet NFTs with BitScrunch integration...');
    
    // Get overall wallet behavior analysis from BitScrunch first
    let walletBehaviorData = null;
    try {
      walletBehaviorData = await analyzeBitScrunchWalletBehavior(walletAddress);
      if (walletBehaviorData) {
        console.log(`BitScrunch wallet risk score: ${walletBehaviorData.riskScore}`);
      }
    } catch (error) {
      console.error('BitScrunch wallet behavior analysis failed:', error);
    }
    
    // Get NFTs from external APIs (Moralis/Alchemy)
    const externalNFTs = await getWalletNFTs(walletAddress);
    
    if (externalNFTs.length > 0) {
      console.log(`Found ${externalNFTs.length} NFTs from external API`);
      
      for (const nftData of externalNFTs.slice(0, 10)) { // Limit to first 10 NFTs
        try {
          // Type guard to ensure nftData has the expected properties
          if (typeof nftData !== 'object' || nftData === null) continue;
          
          const contractAddress = ('token_address' in nftData ? nftData.token_address : nftData.contract?.address) as string;
          const tokenId = ('token_id' in nftData ? nftData.token_id : nftData.tokenId) as string;
          
          if (!contractAddress || !tokenId) continue;

          // Get metadata
          let metadata = nftData.metadata;
          if (!metadata && 'token_uri' in nftData && nftData.token_uri) {
            const fetchedMetadata = await fetchNFTMetadata(nftData.token_uri as string);
            metadata = fetchedMetadata || undefined;
          }

          // Create NFTData object for analysis
          const nftDataForAnalysis: BlockchainNFTData = {
            contractAddress,
            tokenId,
            name: metadata?.name || ('name' in nftData ? nftData.name as string : undefined),
            metadata: metadata || undefined
          };

          // Use enhanced BitScrunch-powered risk analysis
          const riskFactors = await analyzeNFTRisk(nftDataForAnalysis, metadata || null, contractAddress, tokenId.toString());
          
          // Add wallet-specific risk factors from BitScrunch analysis
          if (walletBehaviorData) {
            if (walletBehaviorData.riskScore > 70) {
              riskFactors.push('Wallet owner has high risk profile');
            }
            
            // Add gaming activity insights
            if (walletBehaviorData.gamingActivity) {
              riskFactors.push('Wallet shows gaming activity patterns');
            }
            
            // Add trading pattern insights
            if (walletBehaviorData.tradingPatterns.length > 0) {
              riskFactors.push(...walletBehaviorData.tradingPatterns.map(pattern => 
                `Trading pattern: ${pattern}`
              ));
            }
          }
          
          const riskLevel = riskFactors.length >= 3 ? 'high' : 
                           riskFactors.length >= 1 ? 'medium' : 'low';

          nfts.push({
            contractAddress,
            tokenId: tokenId.toString(),
            name: metadata?.name || ('name' in nftData ? nftData.name as string : `NFT #${tokenId}`),
            description: metadata?.description || ('description' in nftData ? nftData.description as string : 'No description available'),
            image: metadata?.image || metadata?.image_url,
            riskLevel,
            riskFactors,
            metadata: {
              ...metadata,
              collection: ('collection' in nftData && nftData.collection?.name ? nftData.collection.name : 'Unknown Collection'),
              verified: ('collection' in nftData && nftData.collection?.verified ? nftData.collection.verified : false),
              walletRiskScore: walletBehaviorData?.riskScore || 0
            }
          });

          console.log(`Added NFT: ${metadata?.name || `#${tokenId}`} (${riskLevel} risk)`);
        } catch (error) {
          console.error(`Error analyzing NFT:`, error);
          continue;
        }
      }
    } else {
      console.log('No NFTs found for this wallet');
    }

  } catch (error) {
    console.error('Error analyzing wallet NFTs:', error);
  }

  return nfts;
}