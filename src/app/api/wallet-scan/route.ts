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
  fetchTokenPrice,
  KNOWN_SAFE_TOKENS
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

    // For demo purposes, we'll use mock data initially
    // In production, uncomment the lines below to use real blockchain data
    // const provider = getProvider();
    // const ethBalance = await provider.getBalance(address);
    // const ethBalanceFormatted = formatEther(ethBalance);
    
    const ethBalanceFormatted = "0.0000"; // Mock balance
    
    // Analyze tokens and NFTs in the wallet (using mock data for demo)
    const tokens = await analyzeWalletTokens(null, address);
    const nfts = await analyzeWalletNFTs(null, address);

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

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Wallet scan error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze wallet. Please try again.' },
      { status: 500 }
    );
  }
}

async function analyzeWalletTokens(provider: ethers.JsonRpcProvider | null, walletAddress: string): Promise<TokenInfo[]> {
  const tokens: TokenInfo[] = [];
  
  try {
    // In a production app, you'd use APIs like Moralis, Alchemy, or Etherscan 
    // to get all token balances. For this demo, we'll check some common tokens.
    const commonTokens = [
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0xA0b86a33E6441E78ca8E27d0e7C8b1c8B8b8b8b8', // USDC (example)
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ];

    for (const tokenAddress of commonTokens) {
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await contract.balanceOf(walletAddress);
        
        if (balance > 0n) {
          const name = await contract.name();
          const symbol = await contract.symbol();
          const decimals = await contract.decimals();
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
        }
      } catch (error) {
        console.error(`Error analyzing token ${tokenAddress}:`, error);
        // Continue with other tokens
      }
    }

    // Add some mock risky tokens for demonstration
    if (walletAddress.toLowerCase() !== '0x1234567890abcdef1234567890abcdef12345678') {
      tokens.push({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'SuspiciousToken',
        symbol: 'SCAM',
        decimals: 18,
        balance: '1000.0',
        riskLevel: 'high',
        riskFactors: ['Unverified contract', 'No liquidity', 'Recent creation']
      });
    }

  } catch (error) {
    console.error('Error analyzing wallet tokens:', error);
  }

  return tokens;
}

async function analyzeWalletNFTs(provider: ethers.JsonRpcProvider | null, walletAddress: string): Promise<NFTInfo[]> {
  const nfts: NFTInfo[] = [];
  
  try {
    // In production, you'd use APIs to get all NFTs for a wallet
    // For this demo, we'll add some mock NFT analysis
    
    // Mock some NFT analysis results
    nfts.push({
      contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      tokenId: '1234',
      name: 'Bored Ape #1234',
      description: 'A Bored Ape Yacht Club NFT',
      riskLevel: 'low',
      riskFactors: [],
      metadata: {
        verified: true,
        collection: 'Bored Ape Yacht Club'
      }
    });

    // Add a flagged NFT for demonstration
    if (walletAddress.toLowerCase() !== '0x1234567890abcdef1234567890abcdef12345678') {
      nfts.push({
        contractAddress: '0x1111111111111111111111111111111111111111',
        tokenId: '999',
        name: 'Suspicious NFT',
        description: 'This NFT has been flagged',
        riskLevel: 'high',
        riskFactors: ['Reported as stolen', 'Suspicious metadata'],
        metadata: {
          verified: false,
          flagged: true
        }
      });
    }

  } catch (error) {
    console.error('Error analyzing wallet NFTs:', error);
  }

  return nfts;
}