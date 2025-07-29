import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  getProvider,
  isValidEthereumAddress,
  formatEther,
  TokenInfo,
  NFTInfo,
  WalletAnalysis,
  calculateWalletRiskScore,
  getWalletTokenBalances,
  getWalletNFTs
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

    const provider = getProvider();
    
    // Get real ETH balance from blockchain
    const ethBalance = await provider.getBalance(address);
    const ethBalanceFormatted = formatEther(ethBalance);
    
    // Get real token and NFT data using Moralis
    const tokens = await getWalletTokenBalances(address);
    const nfts = await getWalletNFTs(address);

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

