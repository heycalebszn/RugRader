import { NextRequest, NextResponse } from 'next/server';
import {
  isValidEthereumAddress,
  getCollectionInfo
} from '@/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    const { contractAddress } = await request.json();

    // Validate input
    if (!contractAddress || !isValidEthereumAddress(contractAddress)) {
      return NextResponse.json(
        { error: 'Invalid contract address provided' },
        { status: 400 }
      );
    }

    // Get real collection data using Moralis and external APIs
    const collectionInfo = await getCollectionInfo(contractAddress);

    return NextResponse.json(collectionInfo);

  } catch (error) {
    console.error('Collection analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze collection. Please try again.' },
      { status: 500 }
    );
  }
}

