# 🔍 Advanced Crypto Risk Analyzer

A comprehensive blockchain security and risk analysis platform that analyzes NFTs, tokens, collections, and wallets using **real blockchain data** and **AI-powered insights from BitScrunch** - our hackathon sponsor providing cutting-edge NFT analytics and forensic capabilities.

## 🌟 Key Features

### 🎯 **BitScrunch AI Integration** (Hackathon Sponsor)
- **Advanced NFT Analytics**: AI-powered price estimation and market analysis
- **Forensic Data Analysis**: Detect wash trading, volume manipulation, and fraud
- **IP Infringement Detection**: Protect intellectual property with AI image analysis
- **Wallet Behavior Analytics**: Gaming patterns and trading behavior insights
- **Multi-chain Support**: Comprehensive blockchain analytics across networks

### 🛡️ **Core Security Features**
- **NFT Risk Analysis**: Metadata integrity, ownership patterns, trading history
- **Token Risk Assessment**: Smart contract analysis, price volatility, market manipulation
- **Collection Auditing**: Holder distribution, floor price analysis, creation date verification
- **Wallet Security Scanning**: Portfolio risk assessment, suspicious activity detection

### 📊 **Real Data Sources**
- **BitScrunch Network**: Advanced AI analytics and forensic data
- **Blockchain RPCs**: Direct smart contract interactions
- **Moralis API**: Multi-chain data aggregation
- **Alchemy API**: Enhanced blockchain data access
- **Etherscan API**: Contract verification and transaction history
- **OpenSea API**: Market data and collection statistics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- BitScrunch API key (required for advanced features)
- Optional: Moralis, Alchemy, Etherscan API keys for enhanced data

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-risk-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   **Required for BitScrunch integration:**
   ```env
   BITSCRUNCH_API_KEY=your_bitscrunch_api_key_here
   BITSCRUNCH_API_URL=https://api.bitscrunch.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Visit http://localhost:3000**

## 🔧 API Endpoints

### 🎨 NFT Analysis
**Endpoint:** `POST /api/nft-analyzer`

Enhanced with BitScrunch AI capabilities:
- **Trading Pattern Analysis**: Detect wash trading and market manipulation
- **Price Estimation**: AI-powered value assessment with confidence scores  
- **IP Infringement Check**: Protect against copyright violations
- **Forensic Metadata Analysis**: Verify authenticity and detect manipulation

```json
{
  "contractAddress": "0x...",
  "tokenId": "1234"
}
```

### 💰 Token Risk Assessment  
**Endpoint:** `POST /api/token-analyzer`

```json
{
  "tokenAddress": "0x..."
}
```

### 🏛️ Collection Analysis
**Endpoint:** `POST /api/collection-check`

BitScrunch-powered collection forensics:
- **Volume Manipulation Detection**: Identify artificial trading activity
- **Cross-platform Analysis**: Monitor activity across multiple marketplaces
- **Coordinated Trading Detection**: Spot suspicious timing patterns
- **Market Stability Assessment**: Confidence scoring for price estimates

```json
{
  "contractAddress": "0x..."
}
```

### 👤 Wallet Security Scan
**Endpoint:** `POST /api/wallet-scan`

Enhanced with BitScrunch wallet behavior analytics:
- **Gaming Activity Detection**: Identify bot-like behaviors
- **Trading Pattern Analysis**: Sophisticated fraud detection
- **Risk Scoring**: Comprehensive wallet profile assessment
- **Multi-chain Insights**: Cross-chain activity correlation

```json
{
  "address": "0x..."
}
```

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Lucide Icons**: Modern icon library

### Backend Integration
- **BitScrunch Network**: AI-enhanced blockchain analytics
- **Ethers.js**: Ethereum interaction library
- **Axios**: HTTP client for API requests
- **Multi-API Fallbacks**: Redundant data sources for reliability

### Key Features
- **Real-time Analysis**: Live blockchain data processing
- **AI-Powered Insights**: BitScrunch machine learning models
- **Forensic Capabilities**: Advanced fraud detection
- **Multi-chain Support**: Ethereum and Solana compatibility
- **Responsive Design**: Mobile-optimized interface

## 🎯 BitScrunch Integration Benefits

### For NFT Marketplaces
- **Comprehensive Market Analytics**: Trading volumes, price trends, holder statistics
- **Fraud Prevention**: Real-time wash trading and manipulation detection
- **Price Discovery**: AI-powered fair value estimation
- **User Protection**: IP infringement and authenticity verification

### For NFT Lending Protocols  
- **Risk Assessment**: AI-powered collateral valuation
- **Market Analysis**: Deep liquidity and volatility insights
- **Portfolio Evaluation**: Comprehensive asset risk profiling
- **Default Prediction**: Advanced risk modeling capabilities

### For Gaming Projects
- **User Acquisition**: Wallet behavior and gaming pattern analysis
- **Bot Detection**: Identify automated and suspicious activities
- **Community Insights**: Player engagement and retention analytics
- **Fraud Prevention**: Protect against gaming exploits and manipulation

### For Creators and Brands
- **IP Protection**: AI-powered copyright infringement detection
- **Market Intelligence**: Competitive analysis and trend identification
- **Authentication**: Verify original works and detect counterfeits
- **Brand Safety**: Monitor unauthorized use of intellectual property

## 🔒 Security Features

### Advanced Risk Detection
- **AI-Powered Analysis**: BitScrunch machine learning models
- **Pattern Recognition**: Sophisticated fraud detection algorithms
- **Cross-Reference Validation**: Multiple data source verification
- **Real-time Monitoring**: Continuous threat assessment

### Data Protection
- **API Key Security**: Secure credential management
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Graceful failure management
- **Privacy Compliance**: Data protection best practices

## 📈 Performance Optimizations

- **Parallel API Calls**: Concurrent data fetching
- **Intelligent Caching**: Reduced API call overhead
- **Fallback Systems**: Multiple data source redundancy
- **Error Recovery**: Automatic retry mechanisms
- **Progressive Loading**: Enhanced user experience

## 🤝 Contributing

We welcome contributions! This project showcases the power of BitScrunch's API for advanced blockchain analytics.

### Development Guidelines
1. **API Integration**: Leverage BitScrunch capabilities where possible
2. **Error Handling**: Implement comprehensive fallback mechanisms  
3. **Performance**: Optimize for real-time analysis requirements
4. **Security**: Follow blockchain security best practices
5. **Documentation**: Maintain clear API documentation

## 📞 Support

- **BitScrunch Documentation**: [BitScrunch API Catalog](https://bitscrunch.com/api-catalog)
- **Community**: Join the BitScrunch community for support
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Hackathon**: Built for the BitScrunch hackathon - showcasing advanced NFT analytics

## 🏆 Hackathon Highlights

This project demonstrates the comprehensive capabilities of BitScrunch's API:

- ✅ **AI-Powered NFT Analytics**: Advanced price estimation and market analysis
- ✅ **Forensic Data Integration**: Wash trading and fraud detection
- ✅ **IP Protection**: Copyright infringement detection for creators
- ✅ **Gaming Analytics**: Wallet behavior and bot detection
- ✅ **Multi-chain Support**: Ethereum and Solana compatibility
- ✅ **Real Production Use**: No mock data - 100% real blockchain analysis
- ✅ **Scalable Architecture**: Ready for enterprise deployment
- ✅ **Comprehensive Security**: Advanced risk assessment capabilities

---

**Powered by BitScrunch** - The leading provider of decentralized blockchain analytics and AI-enhanced NFT data. Thank you to BitScrunch for sponsoring this hackathon and providing access to cutting-edge blockchain forensics technology!
