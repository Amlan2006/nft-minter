const { ethers } = require('ethers');

// Configuration
const NFT_CONTRACT_ADDRESS = '0x58ddF40D63E5de2AB5fc3a51dEFb2db7521F7e85';
const PRIVATE_KEY = 'ee0e694f3d70cda4889790f0a9ac0fcb97f4d1173ee66c9f3317c25a73b43696';
const RPC_URL = 'https://preseed-testnet-1.roburna.com'; // e.g., https://mainnet.infura.io/v3/YOUR_KEY

// Minting configuration
const MINT_AMOUNT = 1; // Total amount of NFTs to mint
const MERKLE_PROOF = []; // Add your merkle proof here if whitelisted, leave empty [] for public mint

// Full contract ABI
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "qty", "type": "uint256"},
      {"internalType": "bytes32[]", "name": "proof", "type": "bytes32[]"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "wpowner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCost",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintToken",
    "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "mintedPerWallet",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI for token approval
const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function mintByQuantity() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Wallet address:', wallet.address);
    console.log('Contract address:', NFT_CONTRACT_ADDRESS);
    console.log('---');
    
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Get the mint token address
    const mintTokenAddress = await contract.mintToken();
    console.log('Mint token address:', mintTokenAddress);
    
    // Check if native token (ETH) or ERC20 token is required
    const isNativeToken = mintTokenAddress === ethers.ZeroAddress;
    
    let tokenSymbol, tokenDecimals, mintCost, totalCost;
    
    if (isNativeToken) {
      console.log('Payment method: Native token (ETH)');
      tokenSymbol = 'ETH';
      tokenDecimals = 18;
      
      // Get mint cost
      mintCost = await contract.getCost();
      console.log('Mint cost per NFT:', ethers.formatEther(mintCost), tokenSymbol);
      
      // Calculate total cost
      totalCost = mintCost * BigInt(MINT_AMOUNT);
      console.log('Total cost for', MINT_AMOUNT, 'NFTs:', ethers.formatEther(totalCost), tokenSymbol);
      
      // Check ETH balance
      const ethBalance = await provider.getBalance(wallet.address);
      console.log('Your ETH balance:', ethers.formatEther(ethBalance), tokenSymbol);
      
      if (ethBalance < totalCost) {
        console.error('Insufficient ETH balance!');
        console.error('You need', ethers.formatEther(totalCost - ethBalance), 'more ETH');
        process.exit(1);
      }
      
    } else {
      console.log('Payment method: ERC20 token');
      
      const mintToken = new ethers.Contract(mintTokenAddress, ERC20_ABI, wallet);
      
      // Get token info
      tokenSymbol = await mintToken.symbol();
      tokenDecimals = await mintToken.decimals();
      console.log('Mint token:', tokenSymbol);
      
      // Get mint cost
      mintCost = await contract.getCost();
      console.log('Mint cost per NFT:', ethers.formatUnits(mintCost, tokenDecimals), tokenSymbol);
      
      // Calculate total cost
      totalCost = mintCost * BigInt(MINT_AMOUNT);
      console.log('Total cost for', MINT_AMOUNT, 'NFTs:', ethers.formatUnits(totalCost, tokenDecimals), tokenSymbol);
      
      // Check token balance
      const tokenBalance = await mintToken.balanceOf(wallet.address);
      console.log('Your token balance:', ethers.formatUnits(tokenBalance, tokenDecimals), tokenSymbol);
      
      if (tokenBalance < totalCost) {
        console.error('Insufficient token balance!');
        console.error('You need', ethers.formatUnits(totalCost - tokenBalance, tokenDecimals), 'more', tokenSymbol);
        process.exit(1);
      }
      
      // Check current allowance
      const currentAllowance = await mintToken.allowance(wallet.address, NFT_CONTRACT_ADDRESS);
      console.log('Current allowance:', ethers.formatUnits(currentAllowance, tokenDecimals), tokenSymbol);
      
      // Approve tokens if needed
      if (currentAllowance < totalCost) {
        console.log('---');
        console.log('Approving', tokenSymbol, 'tokens...');
        const approveTx = await mintToken.approve(NFT_CONTRACT_ADDRESS, totalCost);
        console.log('Approval transaction hash:', approveTx.hash);
        await approveTx.wait();
        console.log('Tokens approved!');
      }
    }
    
    // Check current supply
    const totalSupply = await contract.totalSupply();
    console.log('---');
    console.log('Current total supply:', totalSupply.toString());
    
    // Check minted per wallet
    const mintedPerWallet = await contract.mintedPerWallet(wallet.address);
    console.log('Already minted by this wallet:', mintedPerWallet.toString());
    
    // Check balance before minting
    const balanceBefore = await contract.balanceOf(wallet.address);
    console.log('NFT balance before:', balanceBefore.toString());
    console.log('---');
    
    console.log(`Minting ${MINT_AMOUNT} NFTs...`);
    
    // Send transaction with ETH value if native token, otherwise no value
    const tx = isNativeToken 
      ? await contract.mint(wallet.address, MINT_AMOUNT, MERKLE_PROOF, { value: totalCost })
      : await contract.mint(wallet.address, MINT_AMOUNT, MERKLE_PROOF);
    
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check balance after minting
    const balanceAfter = await contract.balanceOf(wallet.address);
    console.log('NFT balance after:', balanceAfter.toString());
    console.log('Successfully minted', (balanceAfter - balanceBefore).toString(), 'NFTs!');
    
  } catch (error) {
    console.error('Error minting NFT:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

// Run the minting function
mintByQuantity();
