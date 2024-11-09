import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// Frontend styles
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f7f7f7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '16px',
    color: '#777',
  },
  addressContainer: {
    marginTop: '20px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  address: {
    backgroundColor: '#f0f0f0',
    padding: '10px',
    marginTop: '10px',
    borderRadius: '5px',
    fontSize: '14px',
    wordWrap: 'break-word',
    wordBreak: 'break-all',
  },
  balance: {
    marginTop: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  sendButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '10px 20px',
    marginTop: '20px',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

const App = () => {
  const [wallet, setWallet] = useState({ address: '', privateKey: '', mnemonic: '' });
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');

  const generateWallet = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/wallet/generate', { method: 'POST' });
      const data = await response.json();
      setWallet({
        address: data.address,
        privateKey: data.privateKey,
        mnemonic: data.mnemonic,
      });
      fetchBalance(data.address);
    } catch (error) {
      console.error("Error generating wallet:", error);
    }
    setLoading(false);
  }, []);

  const fetchBalance = async (address) => {
    try {
      const response = await fetch(`http://localhost:3001/api/wallet/${address}/balance`);
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleSendTransaction = async () => {
    if (!toAddress || !amount) return;

    const transaction = {
      privateKey: wallet.privateKey,
      toAddress: toAddress,
      amount: amount,
    };

    try {
      const response = await fetch('http://localhost:3001/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });
      const data = await response.json();
      alert(`Transaction sent! Tx Hash: ${data.txHash}`);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  useEffect(() => {
    generateWallet();
  }, [generateWallet]);

  return (
    <div style={styles.container}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.header}>
          <h1 style={styles.title}>Crypto Wallet</h1>
          <p style={styles.subtitle}>Your secure and simple crypto wallet</p>
        </div>

        <div style={styles.addressContainer}>
          <label style={styles.label}>Your Receiving Address</label>
          <motion.div
            style={styles.address}
            whileHover={{ scale: 1.05 }}
          >
            {wallet.address ? wallet.address : 'Generating wallet...'}
          </motion.div>
        </div>

        <div style={styles.balance}>
          {loading ? (
            <p>Loading balance...</p>
          ) : (
            <p>Balance: {balance} ETH</p>
          )}
        </div>

        <div>
          <label style={styles.label}>Recipient Address</label>
          <input
            style={styles.input}
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="Recipient's Address"
          />
        </div>

        <div>
          <label style={styles.label}>Amount (ETH)</label>
          <input
            style={styles.input}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to send"
          />
        </div>

        <motion.button
          onClick={handleSendTransaction}
          style={styles.sendButton}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Send Transaction
        </motion.button>
      </motion.div>
    </div>
  );
};

export default App;
