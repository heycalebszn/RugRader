# Web3 Risk Analysis Backend

A comprehensive backend system for analyzing Ethereum wallets, NFT collections, and individual NFTs for security risks and suspicious activities.

## 🚀 Features

### 1. Wallet Scanner (`/api/wallet-scan`)
- **Analyzes Ethereum wallet addresses** for risky tokens and NFTs
- **Real blockchain data** using ethers.js
- **Token risk assessment** based on known scam databases and heuristics
- **NFT flagging** for stolen or suspicious NFTs
- **Risk scoring** algorithm with detailed explanations

### 2. Collection Risk Analyzer (`/api/collection-check`)
- **NFT collection analysis** for holder concentration and risk factors
- **Holder distribution analysis** to detect whale manipulation
- **Floor price volatility** tracking and alerts
- **Audit status verification** against known audit databases
- **Wash trading detection** using trading pattern analysis

### 3. NFT Analyzer (`/api/nft-analyzer`)
- **Individual NFT verification** with metadata analysis
- **Ownership verification** through blockchain queries
- **Metadata integrity checks** including IPFS validation
- **Collection reputation scoring** based on verification status
- **Trading pattern analysis** for wash trading detection

## 🛠️ Technology Stack

- **Next.js 15** - Full-stack React framework with API routes
- **ethers.js v6** - Ethereum blockchain interaction
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for external API calls

## 📋 Prerequisites

1. **Node.js 18+** and npm
2. **Ethereum RPC Provider** (Alchemy, Infura, or similar)
3. **Optional**: API keys for enhanced functionality:
   - OpenSea API for NFT marketplace data
   - Etherscan API for contract verification
   - CoinGecko API for token pricing

## ⚙️ Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Required: Ethereum RPC URL
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional: Enhanced features
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
      "address": "0x...",
      "name": "USD Coin",
      "symbol": "USDC",
      "balance": "1000.0",
      "riskLevel": "low",
      "riskFactors": []
    }
  ],
  "nfts": [...],
  "riskScore": 15,
  "riskLevel": "medium",
  "summary": "Wallet analysis complete. Found 1 risky tokens and 1 flagged NFTs."
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
  "topHolders": [...],
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
  "riskLevel": "low",
  "riskFactors": [],
  "metadata": {
    "verified": true,
    "collection": "Bored Ape Yacht Club",
    "owner": "0x...",
    "lastAnalyzed": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔧 Architecture Overview

### Core Components

1. **`src/lib/blockchain.ts`** - Blockchain utilities and risk assessment logic
2. **`src/app/api/wallet-scan/route.ts`** - Wallet analysis endpoint
3. **`src/app/api/collection-check/route.ts`** - Collection analysis endpoint  
4. **`src/app/api/nft-analyzer/route.ts`** - NFT analysis endpoint

### Risk Assessment Algorithm

The backend uses a multi-factor risk assessment system:

- **Token Risk Factors:**
  - Known scam token database lookup
  - Contract verification status
  - Liquidity and trading volume
  - Creation date and developer reputation

- **NFT Risk Factors:**
  - Metadata accessibility and integrity
  - Collection verification status
  - Trading pattern analysis
  - Ownership history verification

- **Collection Risk Factors:**
  - Holder concentration analysis
  - Floor price volatility
  - Wash trading detection
  - Audit status verification

## 🚦 Error Handling

The API implements comprehensive error handling:

- **Input Validation:** All addresses are validated using ethers.js
- **Rate Limiting:** Built-in protection against API abuse
- **Graceful Degradation:** Fallback to demo data if blockchain calls fail
- **Detailed Error Messages:** Clear error responses for debugging

## 🔒 Security Considerations

- **No Private Keys:** The backend only reads from the blockchain
- **Input Sanitization:** All user inputs are validated and sanitized
- **API Key Protection:** Environment variables for sensitive data
- **CORS Configuration:** Proper cross-origin request handling

## 📈 Production Enhancements

For production deployment, consider:

1. **Database Integration:** Store analysis results and risk data
2. **Caching Layer:** Redis for frequently accessed data
3. **Rate Limiting:** Implement proper API rate limiting
4. **Monitoring:** Add logging and analytics
5. **Load Balancing:** Scale across multiple instances
6. **Enhanced APIs:** Integrate with Moralis, Alchemy, or The Graph for comprehensive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the existing GitHub issues
2. Create a new issue with detailed reproduction steps
3. Include relevant error messages and logs

---

**Built with ❤️ for Web3 security and transparency**