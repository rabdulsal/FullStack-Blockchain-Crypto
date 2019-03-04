const Block = require('./block');
const { cryptoHash } = require('../util');

class Blockchain {
  static isValidChain(chainArray) {
    if (JSON.stringify(chainArray[0]) !== JSON.stringify(Block.genesis())) {
       return false;
    }

    for (let i=1; i<chainArray.length; i++) {
      const lastDifficulty = chainArray[i-1].difficulty;
      const {
        timestamp,
        lastHash,
        hash,
        data,
        nonce,
        difficulty
      } = chainArray[i];

      const actualLastHash = chainArray[i-1].hash;

      if (lastHash !== actualLastHash) return false;

      const validatedHash = cryptoHash(
        timestamp,
        lastHash,
        data,
        nonce,
        difficulty
      );

      if (hash !== validatedHash) return false;

      if (Math.abs((lastDifficulty - difficulty) > 1)) return false;
    }

    return true;
  }

  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length-1],
      data
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }
    if (onSuccess) onSuccess();
    console.log('replacing chain with', chain);
    this.chain = chain;
  }

}

module.exports = Blockchain;
