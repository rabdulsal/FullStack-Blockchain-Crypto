const { ec, cryptoHash } = require('../util');
const { STARTING_BALANCE } = require('../config');
const Transaction = require('./transaction');

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();

    this.publicKey = this.keyPair.getPublic().encode('hex');
  }

  sign(data) {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({ amount, recipient, chain }) {
    if (chain) {
      this.balanace = Wallet.calculateBalance({
        chain,
        address: this.publicKey
      });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({
      senderWallet: this,
      amount,
      recipient
    });
  }

  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i=chain.length-1; i>0; i--) {
      const block = chain[i];

      for (const transaction of block.data) {
        if (transaction.input.address === address) hasConductedTransaction = true;

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) outputsTotal += addressOutput;
      }

      if (hasConductedTransaction) break;
    }
    return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }
}

module.exports = Wallet;
