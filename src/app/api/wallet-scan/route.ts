import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  getProvider,
  isValidEthereumAddress,
  formatEther,
  ERC20_ABI,
  ERC721_ABI,
  TokenInfo,
  NFTInfo,
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
          const tokenAddress = tokenData.token_address || tokenData.contractAddress;
          if (!tokenAddress) continue;

          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          
          // Get token details
          const [name, symbol, decimals] = await Promise.all([
            contract.name().catch(() => tokenData.name || 'Unknown'),
            contract.symbol().catch(() => tokenData.symbol || 'UNK'),
            contract.decimals().catch(() => tokenData.decimals || 18)
          ]);

          // Format balance
          const balance = tokenData.balance || tokenData.value || '0';
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
              price,
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
          
          if (balance > 0n) {
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
              price,
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
          const contractAddress = nftData.token_address || nftData.contract?.address;
          const tokenId = nftData.token_id || nftData.tokenId;
          
          if (!contractAddress || !tokenId) continue;

          // Get metadata
          let metadata = nftData.metadata;
          if (!metadata && nftData.token_uri) {
            metadata = await fetchNFTMetadata(nftData.token_uri);
          }

          // Use enhanced BitScrunch-powered risk analysis
          const riskFactors = await analyzeNFTRisk(nftData, metadata, contractAddress, tokenId.toString());
          
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
            name: metadata?.name || nftData.name || `NFT #${tokenId}`,
            description: metadata?.description || nftData.description || 'No description available',
            image: metadata?.image || metadata?.image_url,
            riskLevel,
            riskFactors,
            metadata: {
              ...metadata,
              collection: nftData.collection?.name || 'Unknown Collection',
              verified: nftData.collection?.verified || false,
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