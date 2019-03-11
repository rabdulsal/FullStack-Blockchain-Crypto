const PubNub = require('pubnub');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

const credentials = process.env.ENV==='development' ?
  require('../private/PubNubCredentials') :
  {
    publishKey: process.env.PUBNUB_PUBKEY,
    subscribeKey: process.env.PUBNUB_SUBKEY,
    secretKey: process.env.PUBNUB_SECRET
  };


class PubSub {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubnub = new PubNub(credentials);

    this.pubnub.subscribe({
      channels: Object.values(CHANNELS) /* Automatically subscribe to all channels in 'CHANNELS' */
    });

    this.pubnub.addListener(this.listener());
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        console.log(`Message received. Channel: ${channel}. Message: ${message}`);

        const parsedMessage = JSON.parse(message);

        switch (channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              this.transactionPool.clearBlockchainTransactions({
                chain: parsedMessage
              });
            });
            break;
          case CHANNELS.TRANSACTION:
          if (!this.transactionPool.existingTransaction({
            inputAddress: this.wallet.publicKey
          })) {
            this.transactionPool.setTransaction(parsedMessage);
          }
            break;
          default:
            return;
        }
      }
    };
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  broadcastChain() {
    this.pubnub.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
}

module.exports = PubSub;
