const { ethers } = require('ethers');
require('dotenv').config();

// Configuration from environment variables
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x58ddF40D63E5de2AB5fc3a51dEFb2db7521F7e85';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://preseed-testnet-1.roburna.com';

if (!PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY not found in environment variables!');
  console.error('Please create a .env file with your PRIVATE_KEY');
  process.exit(1);
}

// Distribution configuration
// Format: { address: 'recipient_address', tokenIds: [1, 2, 3] }
const DISTRIBUTIONS = [
  { address: '0x7Ca30fb55a0fB2aFf563DBb534E056CE90441568', tokenIds: [1, 2] },
  { address: '0x47ADF21c50D82fDC77Fc6C518659690797f6E6f2', tokenIds: [3, 4, 5] },
  { address: '0xf6625CdFbD678518CD5Dc447EA1df9a8e8591Ca7', tokenIds: [6] }
];

// ERC721 ABI for transfers
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "wpowner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function distributeNFTs() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Distributor wallet:', wallet.address);
    console.log('Contract address:', NFT_CONTRACT_ADDRESS);
    console.log('---');
    
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Check initial balance
    const initialBalance = await contract.balanceOf(wallet.address);
    console.log('Your NFT balance:', initialBalance.toString());
    console.log('---');
    
    let totalTransferred = 0;
    let successfulTransfers = 0;
    let failedTransfers = 0;
    
    // Process each distribution
    for (const distribution of DISTRIBUTIONS) {
      const { address, tokenIds } = distribution;
      
      console.log(`\nDistributing to ${address}:`);
      console.log(`Token IDs: [${tokenIds.join(', ')}]`);
      
      for (const tokenId of tokenIds) {
        try {
          // Verify ownership before transfer
          const owner = await contract.ownerOf(tokenId);
          
          if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
            console.log(`  ❌ Token ID ${tokenId}: You don't own this token (owner: ${owner})`);
            failedTransfers++;
            continue;
          }
          
          console.log(`  Transferring token ID ${tokenId}...`);
          
          // Use safeTransferFrom for safer transfers
          const tx = await contract.safeTransferFrom(wallet.address, address, tokenId);
          console.log(`  Transaction hash: ${tx.hash}`);
          
          const receipt = await tx.wait();
          console.log(`  ✅ Token ID ${tokenId} transferred (block: ${receipt.blockNumber})`);
          
          successfulTransfers++;
          totalTransferred++;
          
        } catch (error) {
          console.error(`  ❌ Failed to transfer token ID ${tokenId}:`, error.message);
          failedTransfers++;
        }
      }
    }
    
    // Final summary
    console.log('\n---');
    console.log('Distribution Summary:');
    console.log(`Total transfers attempted: ${successfulTransfers + failedTransfers}`);
    console.log(`Successful: ${successfulTransfers}`);
    console.log(`Failed: ${failedTransfers}`);
    
    const finalBalance = await contract.balanceOf(wallet.address);
    console.log(`\nYour NFT balance: ${initialBalance.toString()} → ${finalBalance.toString()}`);
    console.log('Distribution complete!');
    
  } catch (error) {
    console.error('Error during distribution:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

distributeNFTs();
