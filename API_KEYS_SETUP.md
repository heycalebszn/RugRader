# 🔑 API Keys Setup Guide

To use **real blockchain integrations** instead of mock data, you need to obtain API keys from the following services. This guide will walk you through getting each one.

## 🚨 **REQUIRED API Keys**

### 1. **Moralis API Key** (REQUIRED)
**Purpose**: Real-time blockchain data, token balances, NFT metadata, and transfers

**Steps to get it:**
1. Go to [moralis.io](https://moralis.io)
2. Click "Start for Free" and create an account
3. Verify your email address
4. Once logged in, go to "Web3 APIs" section
5. Copy your API key from the dashboard
6. **FREE TIER**: 40,000 requests/month

**Add to `.env.local`:**
```bash
MORALIS_API_KEY=your_moralis_api_key_here
```

### 2. **Etherscan API Key** (REQUIRED)
**Purpose**: Contract verification, creation dates, and source code validation

**Steps to get it:**
1. Go to [etherscan.io](https://etherscan.io)
2. Create an account and verify your email
3. Go to "API-KEYs" in your account menu
4. Click "Add" to create a new API key
5. Give it a name (e.g., "Web3 Risk Analysis")
6. **FREE TIER**: 5 requests/second, 100,000 requests/day

**Add to `.env.local`:**
```bash
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## 📈 **OPTIONAL API Keys** (Enhance functionality)

### 3. **CoinGecko API Key** (Optional)
**Purpose**: Enhanced token price data and market information

**Steps to get it:**
1. Go to [coingecko.com](https://www.coingecko.com/en/api)
2. Click "Get Your API Key"
3. Sign up for a free account
4. Choose the "Demo" plan (free)
5. Get your API key from the dashboard
6. **FREE TIER**: 10,000 requests/month

**Add to `.env.local`:**
```bash
COINGECKO_API_KEY=your_coingecko_api_key_here
```

### 4. **OpenSea API Key** (Optional)
**Purpose**: NFT floor prices and marketplace data

**Steps to get it:**
1. Go to [opensea.io](https://opensea.io)
2. Create an account
3. Go to [OpenSea API documentation](https://docs.opensea.io/reference/api-overview)
4. Request API access (may require approval)
5. **Note**: OpenSea API access is more restrictive and may require business justification

**Add to `.env.local`:**
```bash
OPENSEA_API_KEY=your_opensea_api_key_here
```

## 🔧 **Complete .env.local Setup**

Create a `.env.local` file in your project root with:

```bash
# Required: Ethereum RPC URL (using free public endpoint)
ETHEREUM_RPC_URL=https://ethereum-rpc.publicnode.com

# Required: Moralis API key for real blockchain data
MORALIS_API_KEY=your_moralis_api_key_here

# Required: Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Enhanced token price data
COINGECKO_API_KEY=your_coingecko_api_key_here

# Optional: NFT marketplace data
OPENSEA_API_KEY=your_opensea_api_key_here
```

## 🚀 **Quick Start (Minimum Setup)**

**For immediate testing**, you only need:

1. **Moralis API Key** - Get this first (5 minutes)
2. **Etherscan API Key** - Get this second (5 minutes)

With just these two keys, you'll have:
- ✅ Real wallet token balances
- ✅ Real NFT detection and metadata
- ✅ Real contract verification
- ✅ Real collection analysis
- ✅ Risk assessment based on actual blockchain data

## 🧪 **Testing Your Setup**

After adding your API keys:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test with a real Ethereum address:**
   - Go to `http://localhost:3000`
   - Try analyzing: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (Vitalik's address)

3. **Test with a real NFT collection:**
   - Go to collection check page
   - Try: `0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D` (Bored Ape Yacht Club)

4. **Test with a real NFT:**
   - Go to NFT analyzer page
   - Contract: `0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D`
   - Token ID: `1`

## ⚠️ **Important Notes**

### Rate Limits
- **Moralis**: 40,000 requests/month (free)
- **Etherscan**: 5 requests/second
- **CoinGecko**: 10,000 requests/month (free)

### Security
- **Never commit `.env.local` to git**
- **Keep your API keys private**
- **Use environment variables in production**

### Fallbacks
- If an API key is missing, the system will gracefully degrade
- Error handling is built-in for API failures
- Some features may be limited without optional keys

## 🎯 **What You Get With Real Integrations**

### ✅ **Wallet Scanner**
- Real token balances from any Ethereum wallet
- Actual risk assessment based on contract verification
- Real NFT holdings with metadata
- Genuine price data for tokens

### ✅ **Collection Analyzer**
- Real holder distribution analysis
- Actual total supply and contract data
- Floor price data (with OpenSea API)
- Contract verification status

### ✅ **NFT Analyzer**
- Real metadata fetching from IPFS/HTTP
- Actual ownership verification
- Contract verification checks
- Collection reputation scoring

---

**🎉 Once set up, you'll have a fully functional Web3 risk analysis tool with real blockchain data!**