const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose();

const INFURA_PROJECT_ID = '';  // Replace with your Infura project ID
const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./wallets.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create table for wallets if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    privateKey TEXT NOT NULL,
    mnemonic TEXT NOT NULL
  )
`);

// Initialize Infura provider
const provider = new ethers.JsonRpcProvider(INFURA_URL);

// Endpoint to generate wallet and save to DB
app.post('/api/wallet/generate', async (req, res) => {
  try {
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;

    // Insert wallet into DB
    const query = `INSERT INTO wallets (address, privateKey, mnemonic) VALUES (?, ?, ?)`;
    db.run(query, [wallet.address, wallet.privateKey, mnemonic], function (err) {
      if (err) {
        console.error('Error saving wallet to DB:', err.message);
        return res.status(500).json({ error: 'Failed to save wallet to DB' });
      }

      res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate wallet', details: error.message });
  }
});

// Endpoint to get wallet balance
app.get('/api/wallet/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance); // Convert from wei to ether
    res.json({ balance: balanceInEth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance', details: error.message });
  }
});

// Endpoint to send transaction
app.post('/api/wallet/send', async (req, res) => {
  const { privateKey, toAddress, amount } = req.body;

  try {
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount), // Convert Ether string to Wei
      gasLimit: 21000,  // Standard gas limit for ETH transfer
      gasPrice: await provider.getGasPrice()
    };

    const txResponse = await wallet.sendTransaction(tx);
    await txResponse.wait(); // Wait for transaction to be mined

    res.json({ txHash: txResponse.hash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send transaction', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
