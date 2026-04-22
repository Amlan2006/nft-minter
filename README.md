# NFT Minting Script

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the script by editing `mint-nft.js`:
   - `NFT_CONTRACT_ADDRESS`: Your NFT collection contract address
   - `PRIVATE_KEY`: Your wallet private key (keep this secure!)
   - `RPC_URL`: Your blockchain RPC endpoint

## Usage

```bash
npm run mint
```

## Security Notes

- Never commit your private key to version control
- Consider using environment variables for sensitive data
- Test on a testnet first before using real funds
