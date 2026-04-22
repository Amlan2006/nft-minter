# NFT Minting Script

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the `.env` file:
   - `PRIVATE_KEY`: Your wallet private key
   - `NFT_CONTRACT_ADDRESS`: Your NFT collection contract address
   - `RPC_URL`: Your blockchain RPC endpoint

## Usage

### Mint NFTs
```bash
npm run mint
```

Edit `mint-nft.js` to configure:
- `MINT_AMOUNT`: How many NFTs to mint
- `MERKLE_PROOF`: Whitelist proof (leave empty for public mint)

### Distribute NFTs
```bash
npm run distribute
```

Edit `distribute-nfts.js` to configure the `DISTRIBUTIONS` array:
```javascript
const DISTRIBUTIONS = [
  { address: '0xRecipient1', tokenIds: [1, 2, 3] },
  { address: '0xRecipient2', tokenIds: [4, 5] }
];
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your private key secure
- Test on a testnet first before using real funds
