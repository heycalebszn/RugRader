# Web3 Risk Analyzer

A comprehensive Web3 security analysis platform that analyzes Ethereum wallets, NFT collections, and individual NFTs for security risks and suspicious activities using **real blockchain data only** - no mock or static data.

## 🚀 Features

### 1. **Wallet Risk Scanner**
- **Real-time blockchain analysis** using ethers.js and external APIs
- **Token risk assessment** with live price data from CoinGecko
- **NFT portfolio analysis** with metadata verification
- **Comprehensive risk scoring** based on multiple factors
- **Integration with Moralis and Alchemy APIs** for complete token/NFT data

### 2. **NFT Collection Analyzer**
- **Live holder distribution analysis** from blockchain data
- **Floor price tracking** via OpenSea and marketplace APIs
- **Smart contract verification** through Etherscan
- **Whale concentration detection** and risk assessment
- **Audit status verification** against known databases

### 3. **Individual NFT Analyzer**
- **Real metadata verification** with IPFS support
- **Ownership verification** through blockchain queries
- **Collection reputation scoring** based on verification status
- **Suspicious pattern detection** in metadata and ownership
- **Contract verification status** checking

## 🛠️ Technology Stack

- **Next.js 15** - Full-stack React framework with API routes
- **ethers.js v6** - Ethereum blockchain interaction
- **TypeScript** - Type-safe development
- **Axios** - HTTP client with retry logic and error handling
- **External APIs**: Moralis, Alchemy, OpenSea, Etherscan, CoinGecko

## ⚙️ Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Required: Ethereum RPC URL (free public endpoint provided)
ETHEREUM_RPC_URL=https://ethereum-rpc.publicnode.com

# For better performance, use a dedicated RPC provider:
# ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
# ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Optional but recommended for comprehensive data:
MORALIS_API_KEY=your_moralis_api_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
OPENSEA_API_KEY=your_opensea_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Wallet Scanner API

**Endpoint:** `POST /api/wallet-scan`

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C0C3c6c8C8C6C6"
}
```

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C0C3c6c8C8C6C6",
  "ethBalance": "1.2345",
  "tokens": [
    {
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "name": "Tether USD",
      "symbol": "USDT",
      "decimals": 6,
      "balance": "1000.0",
      "price": 1.00,
      "riskLevel": "low",
      "riskFactors": []
    }
  ],
  "nfts": [
    {
      "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "tokenId": "1234",
      "name": "Bored Ape #1234",
      "description": "A Bored Ape Yacht Club NFT",
      "image": "ipfs://...",
      "riskLevel": "low",
      "riskFactors": [],
      "metadata": {
        "collection": "Bored Ape Yacht Club",
        "verified": true,
        "owner": "0x...",
        "attributes": [...]
      }
    }
  ],
  "riskScore": 15,
  "riskLevel": "medium",
  "summary": "Wallet analysis complete. Found 0 risky tokens and 0 flagged NFTs."
}
```

### Collection Risk Analyzer API

**Endpoint:** `POST /api/collection-check`

**Request Body:**
```json
{
  "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
}
```

**Response:**
```json
{
  "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "name": "Bored Ape Yacht Club",
  "totalSupply": 10000,
  "floorPrice": 12.5,
  "holderCount": 6500,
  "topHolders": [
    {
      "address": "0x1111111111111111111111111111111111111111",
      "count": 156,
      "percentage": 1.56
    }
  ],
  "riskLevel": "low",
  "riskFactors": [],
  "auditStatus": "passed"
}
```

### NFT Analyzer API

**Endpoint:** `POST /api/nft-analyzer`

**Request Body:**
```json
{
  "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "tokenId": "1234"
}
```

**Response:**
```json
{
  "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "tokenId": "1234",
  "name": "Bored Ape #1234",
  "description": "A unique Bored Ape NFT",
  "image": "ipfs://...",
  "riskLevel": "low",
  "riskFactors": [],
  "metadata": {
    "owner": "0x...",
    "tokenURI": "ipfs://...",
    "collection": "Bored Ape Yacht Club",
    "verified": true,
    "attributes": [...],
    "lastAnalyzed": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔧 Architecture Overview

### Core Components

1. **`src/lib/blockchain.ts`** - Blockchain utilities with real API integrations
2. **`src/app/api/wallet-scan/route.ts`** - Wallet analysis endpoint
3. **`src/app/api/collection-check/route.ts`** - Collection analysis endpoint  
4. **`src/app/api/nft-analyzer/route.ts`** - NFT analysis endpoint
5. **`src/app/page.tsx`** - Enhanced frontend with three analysis modes

### Real Data Sources

- **Ethereum Blockchain**: Direct contract calls via ethers.js
- **Moralis API**: Comprehensive token and NFT data
- **Alchemy API**: Fallback for token/NFT data
- **OpenSea API**: Floor prices and collection stats
- **Etherscan API**: Contract verification and creation dates
- **CoinGecko API**: Real-time token pricing

### Risk Assessment Algorithm

The system uses a multi-factor risk assessment approach:

**Token Risk Factors:**
- Known high-volatility tokens
- Contract verification status
- Suspicious naming patterns
- Token symbol anomalies

**NFT Risk Factors:**
- Metadata accessibility and integrity
- Collection verification status
- Suspicious ownership patterns
- Contract verification

**Collection Risk Factors:**
- Holder concentration analysis
- Recent creation detection
- Contract verification status
- Trading volume analysis

## 🚦 Error Handling & Resilience

- **Retry Logic**: All API calls include automatic retry with exponential backoff
- **Fallback Systems**: Multiple data sources with automatic failover
- **Rate Limit Protection**: Built-in handling for API rate limits
- **Graceful Degradation**: System continues to function even if some APIs fail
- **Comprehensive Logging**: Detailed error logging for debugging

## 🔒 Security Features

- **No Private Keys**: The system only reads from the blockchain
- **Input Validation**: All addresses and inputs are validated
- **API Key Protection**: Environment variables for sensitive data
- **CORS Configuration**: Proper cross-origin request handling
- **Rate Limiting**: Protection against API abuse

## 📈 Production Considerations

For production deployment:

1. **API Keys**: Obtain API keys for Moralis, Alchemy, OpenSea, Etherscan, and CoinGecko
2. **Database Integration**: Consider adding a database for caching analysis results
3. **Redis Caching**: Implement caching for frequently accessed data
4. **Load Balancing**: Scale across multiple instances
5. **Monitoring**: Add comprehensive logging and analytics
6. **Rate Limiting**: Implement proper API rate limiting for your endpoints

## 🎯 Key Features

✅ **100% Real Data** - No mock or static data anywhere in the system  
✅ **Multi-API Integration** - Moralis, Alchemy, OpenSea, Etherscan, CoinGecko  
✅ **Comprehensive Error Handling** - Retry logic, fallbacks, graceful degradation  
✅ **Real-time Analysis** - Live blockchain data and market prices  
✅ **Advanced Risk Assessment** - Multi-factor scoring algorithms  
✅ **Modern UI** - Clean, responsive interface with three analysis modes  

## 🚀 Getting Started

1. Clone the repository
2. Copy `.env.local` and add your API keys (optional but recommended)
3. Run `npm install`
4. Run `npm run dev`
5. Open `http://localhost:3000`
6. Start analyzing wallets, collections, and NFTs!

The system works with just the free public RPC endpoint, but adding API keys will significantly improve performance and data coverage.

---

**Built with ❤️ for Web3 security and transparency**
