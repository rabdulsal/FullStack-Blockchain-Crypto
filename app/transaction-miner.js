const Transaction = require('../wallet/transaction');

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  mineTransactions() {
    // get the transaction pool's valid mineTransactions
    const validTransactions = this.transactionPool.validTransactions();
    // genereate the miner's reward
    validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );
    // add a block cosisiting of these transacations to the BLOCKCHAIN
    this.blockchain.addBlock({ data: validTransactions });
    // broadcast updated blockchain
    this.pubsub.broadcastChain();
    // clear pool
    this.transactionPool.clear();
  }
}

module.exports = TransactionMiner;
