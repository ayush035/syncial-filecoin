// scripts/setup-storage-wallet.js
import { Synapse, RPC_URLS, TOKENS } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const STORAGE_PRIVATE_KEY = '0x0053b694aacec535e305a9f1fc9ae7d4070e31a29e84253215924635c148176e'

async function setupStorageWallet() {
  console.log('🚀 Setting up centralized storage wallet...\n');

  if (!STORAGE_PRIVATE_KEY) {
    console.error('❌ STORAGE_PRIVATE_KEY not found in .env.local file');
    console.log('Please add: STORAGE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE');
    process.exit(1);
  }

  try {
    // Create Synapse instance with your storage wallet
    console.log('📡 Connecting to Filecoin Calibration testnet...');
    const synapse = await Synapse.create({
      privateKey: STORAGE_PRIVATE_KEY,
      rpcURL: RPC_URLS.calibration.websocket, // Change to mainnet for production
      withCDN: true
    });

    const wallet = new ethers.Wallet(STORAGE_PRIVATE_KEY);
    console.log(`✅ Connected with wallet: ${wallet.address}\n`);

    // Step 1: Check current balances
    console.log('💰 Checking current balances...');
    const walletBalance = await synapse.payments.walletBalance(TOKENS.USDFC);
    
    let accountInfo;
    try {
      accountInfo = await synapse.payments.accountInfo();
    } catch (accountError) {
      console.log('   Account info not available (likely first time setup)');
      accountInfo = { totalFunds: 0n, availableFunds: 0n };
    }
    
    console.log(`   Wallet USDFC balance: ${ethers.formatUnits(walletBalance, 18)} USDFC`);
    console.log(`   Payments contract balance: ${accountInfo.totalFunds ? ethers.formatUnits(accountInfo.totalFunds, 18) : '0'} USDFC`);
    console.log(`   Available for storage: ${accountInfo.availableFunds ? ethers.formatUnits(accountInfo.availableFunds, 18) : '0'} USDFC\n`);

    // Step 2: Deposit USDFC tokens if needed
    const minimumDeposit = ethers.parseUnits('50', 18); // 50 USDFC minimum
    const totalFunds = accountInfo.totalFunds || 0n;
    
    if (totalFunds < minimumDeposit) {
      console.log('📤 Depositing USDFC tokens to payments contract...');
      
      if (walletBalance < minimumDeposit) {
        console.error('❌ Insufficient USDFC in wallet!');
        console.log(`   Need at least ${ethers.formatUnits(minimumDeposit, 18)} USDFC in wallet`);
        console.log('   Please acquire USDFC tokens first (for Calibration testnet, find a faucet)');
        process.exit(1);
      }

      const depositAmount = ethers.parseUnits('50', 18); // Deposit 100 USDFC
      console.log(`   Depositing ${ethers.formatUnits(depositAmount, 18)} USDFC...`);
      
      try {
        const depositTx = await synapse.payments.deposit(depositAmount);
        console.log(`   Transaction sent: ${depositTx.hash}`);
        
        console.log('   ⏳ Waiting for confirmation...');
        await depositTx.wait();
        console.log('   ✅ Deposit confirmed!\n');
      } catch (depositError) {
        console.error('   ❌ Deposit failed:', depositError.message);
        if (depositError.message.includes('insufficient funds')) {
          console.log('   💡 Make sure you have enough USDFC and FIL for gas fees');
        }
        throw depositError;
      }
    } else {
      console.log('✅ Sufficient balance already deposited\n');
    }

    // Step 3: Approve Warm Storage service
    console.log('🔐 Checking Warm Storage service approval...');
    const warmStorageAddress = await synapse.getWarmStorageAddress();
    console.log(`   Warm Storage address: ${warmStorageAddress}`);

    const serviceStatus = await synapse.payments.serviceApproval(warmStorageAddress);
    console.log(`   Service approved: ${serviceStatus.isApproved}`);
    
    if (!serviceStatus.isApproved) {
      console.log('   🔓 Approving Warm Storage service...');
      
      const approveTx = await synapse.payments.approveService(
        warmStorageAddress,
        ethers.parseUnits('10', 18),   // 10 USDFC per epoch rate allowance
        ethers.parseUnits('1000', 18), // 1000 USDFC total lockup allowance
        86400n                         // 30 days max lockup period (in epochs)
      );
      
      console.log(`   Transaction sent: ${approveTx.hash}`);
      console.log('   ⏳ Waiting for confirmation...');
      
      await approveTx.wait();
      console.log('   ✅ Service approval confirmed!\n');
    } else {
      console.log('   ✅ Service already approved\n');
    }

    // Step 4: Final status check
    console.log('📊 Final status check...');
    
    let finalAccountInfo;
    try {
      finalAccountInfo = await synapse.payments.accountInfo();
    } catch (finalError) {
      console.log('   Using deposit transaction result for final status');
      finalAccountInfo = { totalFunds: ethers.parseUnits('50', 18), availableFunds: ethers.parseUnits('50', 18) };
    }
    
    const finalServiceStatus = await synapse.payments.serviceApproval(warmStorageAddress);
    
    console.log(`   Total funds: ${finalAccountInfo.totalFunds ? ethers.formatUnits(finalAccountInfo.totalFunds, 18) : '0'} USDFC`);
    console.log(`   Available: ${finalAccountInfo.availableFunds ? ethers.formatUnits(finalAccountInfo.availableFunds, 18) : '0'} USDFC`);
    console.log(`   Service approved: ${finalServiceStatus.isApproved}`);
    console.log(`   Rate allowance: ${ethers.formatUnits(finalServiceStatus.rateAllowance, 18)} USDFC/epoch`);
    
    console.log('\n🎉 Storage wallet setup complete!');
    console.log('   Your users can now upload images without any payment setup.');
    console.log('   All storage costs will be paid by your centralized wallet.');

    // Clean up connection
    const provider = synapse.getProvider();
    if (provider && typeof provider.destroy === 'function') {
      await provider.destroy();
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution: Add more USDFC tokens to your wallet');
    } else if (error.message.includes('user rejected')) {
      console.log('\n💡 Note: This script requires automatic transaction signing');
    }
    
    console.log('\nFor Calibration testnet USDFC tokens, try:');
    console.log('   - Filecoin faucets');
    console.log('   - Bridge from other testnets');
    
    process.exit(1);
  }
}

// Additional helper function to check status anytime
async function checkStorageStatus() {
  console.log('🔍 Checking storage wallet status...\n');

  try {
    const synapse = await Synapse.create({
      privateKey: STORAGE_PRIVATE_KEY,
      rpcURL: RPC_URLS.calibration.websocket
    });

    const wallet = new ethers.Wallet(STORAGE_PRIVATE_KEY);
    console.log(`Wallet: ${wallet.address}`);

    const accountInfo = await synapse.payments.accountInfo();
    const warmStorageAddress = await synapse.getWarmStorageAddress();
    const serviceStatus = await synapse.payments.serviceApproval(warmStorageAddress);

    console.log(`Total funds: ${ethers.formatUnits(accountInfo.totalFunds, 18)} USDFC`);
    console.log(`Available: ${ethers.formatUnits(accountInfo.availableFunds, 18)} USDFC`);
    console.log(`Service approved: ${serviceStatus.isApproved}`);
    
    const isReady = accountInfo.availableFunds > 0 && serviceStatus.isApproved;
    console.log(`\nStatus: ${isReady ? '✅ Ready for uploads' : '⚠️ Setup required'}`);

    const provider = synapse.getProvider();
    if (provider?.destroy) await provider.destroy();

  } catch (error) {
    console.error('Status check failed:', error.message);
  }
}

// Run setup or status check based on command line argument
const command = process.argv[2];

if (command === 'status') {
  checkStorageStatus();
} else {
  setupStorageWallet();
}

export { setupStorageWallet, checkStorageStatus };