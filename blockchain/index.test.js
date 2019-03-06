const Blockchain = require('./index');
const Block = require('./block');
const cryptoHash = require('../util/crypto-hash');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

describe('Blockchain', () => {
  let blockchain, newChain, originalChain, errorMock;

  beforeEach(() => {
    blockchain = new Blockchain(); // New blockchain instance before each test
    newChain = new Blockchain();
    errorMock = jest.fn();
    originalChain = blockchain.chain;
    global.console.error = errorMock;
  });

  it('contains a `chain` Array instance', () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it('starts with the genesis block', () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it('adds a new block to the chain', () => {
    const newData = 'foo bar';
    blockchain.addBlock({ data: newData });

    expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);
  });

  describe('isValidChain()', () => {
    describe('when the chain does not start with the genesis block', () => {
      it('returns false', () => {
        blockchain.chain[0] = { data: 'fake-genesis' };

        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe('when the chain stars with the genesis block and has multiple blocks', () => {
      beforeEach(() => {
        blockchain.addBlock({ data: 'Bears' });
        blockchain.addBlock({ data: 'Beets' });
        blockchain.addBlock({ data: 'Battlestar Galactica' });
      });

      describe('and a lastHash reference has changed', () => {
        it('returns false', () => {
          blockchain.chain[2].lastHash = 'broken-lastHash';

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with an invalid field', () => {
        it('returns false', () => {
          blockchain.chain[2].data = 'some-bad-and-evil-data';

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with a jumped difficulty', () => {
        it('returns false', () => {
          const lastBlock = blockchain.chain[blockchain.chain.length-1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nonce = 0;
          const data = [];
          const difficulty = lastBlock.difficulty - 3;
          const hash = cryptoHash(timestamp, lastHash, difficulty, data);
          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            nonce,
            difficulty,
            data
          });

          blockchain.chain.push(badBlock);

          expect(Blockchain.isValidChain(blockchain.chain))
          .toBe(false);
        });
      });

      describe('and the chain does not contain any invalid blocks', () => {
        it('returns true', () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });

  describe('replaceChain()', () => {
    let logMock;

    beforeEach(() => {
      logMock = jest.fn();
      global.console.log = logMock;
    });

    describe('when the new chain is not longer', () => {
      beforeEach(() => {
        newChain.chain[0] = { new: 'chain' };
        blockchain.replaceChain(newChain.chain);
      });

      it('does not replace the chain', () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it('logs an error', () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('when the new chain is longer', () => {
      beforeEach(() => {
        newChain.addBlock({ data: 'Bears' });
        newChain.addBlock({ data: 'Beets' });
        newChain.addBlock({ data: 'Battlestar Galactica' });
      });

      describe('and the chain is invalid', () => {
        beforeEach(() => {
          newChain.chain[2].hash = 'some-fake-hash';
          blockchain.replaceChain(newChain.chain);
        });

        it('does not replace the chain', () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it('logs an error', () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the chain is valid', () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });

        it('replaces the chain', () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });

        it('logs about the chain replacement', () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the validateTransactions flag is true', () => {
      it('calls validTransactionData()', () => {
        const validTransactionDataMock = jest.fn();
        blockchain.validTransactionData = validTransactionDataMock;
        newChain.addBlock({ data: 'foo' });
        blockchain.replaceChain(newChain.chain, true);
        expect(validTransactionDataMock).toHaveBeenCalled();
      });
    });
  });

  describe('validTransactionData()', () => {
    let transaction, rewardTransaction, wallet, walletKey;

    beforeEach(() => {
      wallet = new Wallet();
      walletKey = wallet.publicKey;
      transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 });
      rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
    });

    describe('and the transaction data is valid', () => {
      it('returns true', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction] });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
        expect(errorMock).not.toHaveBeenCalled();
      });
    });

    describe('the transaction data has multiple rewards', () => {
      it('returns false and logs and error', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is NOT a reward transaction', () => {
        it('returns false and logs and error', () => {
          transaction.outputMap[walletKey] = 999999;
          newChain.addBlock({ data: [transaction, rewardTransaction] });
          expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction IS a reward transacation', () => {
        it('returns false and logs and error', () => {
          rewardTransaction.outputMap[walletKey] = 999999;
          newChain.addBlock({ data: [transaction, rewardTransaction] });
          expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the transaction data has at least one malformed input', () => {
      it('returns false and logs and error', () => {
        wallet.balance = 9000;

        const fakeOutputMap = {
          [walletKey]: 8900,
          fooRecipient: 100
        };

        const fakeTransaction = {
          input: {
            timestamp: Date.now(),
            amount: wallet.balance,
            address: walletKey,
            signature: wallet.sign(fakeOutputMap)
          },
          outputMap: fakeOutputMap
        };
        newChain.addBlock({ data: [fakeTransaction, rewardTransaction] });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and a block contains multiple identical transaction', () => {
      it('returns false and logs and error', () => {
        newChain.addBlock({
          data: [transaction, transaction, transaction, rewardTransaction]
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });
  });
});
