const uuid = require('uuid/v1');
const { verifySignature } = require('../util');

class Transaction {
  constructor({ senderWallet, recipient, amount }) {
    this.id = uuid();
    this.outputMap = this.createOutputMap({ senderWallet, recipient, amount });
    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};

    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    return outputMap
  }

  createInput({ senderWallet, outputMap}) {
    const input = {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap)
    };
    return input;
  }

  update({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds balance');
    }

    if(!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] = this.outputMap[recipient] + amount;
    }

    this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount

    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  static getOutputTotal(outputMap) {
    return Object.values(outputMap)
    .reduce((total, outputAmount) => total + outputAmount);
  }

  static validTransaction(transaction) {
    const { input: { address, amount, signature }, outputMap } = transaction;
    // const { address, amount, signature } = input NOTE: Nested-destructuring above
    const outputTotal = Transaction.getOutputTotal(outputMap);

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);
      return false;
    }

    if (!verifySignature({
      publicKey: address,
      data: outputMap,
      signature
    })) {
      console.error(`Invalid transaction signature from ${address}`);
      return false
    };

    return true;
  }
}

module.exports = Transaction;
