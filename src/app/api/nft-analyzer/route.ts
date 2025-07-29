import { NextRequest, NextResponse } from 'next/server';
import {
  isValidEthereumAddress,
  getNFTInfo
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

    // Get real NFT data using Moralis and external APIs
    const nftInfo = await getNFTInfo(contractAddress, tokenId);

    return NextResponse.json(nftInfo);

  } catch (error) {
    console.error('NFT analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze NFT. Please try again.' },
      { status: 500 }
    );
  }
}

