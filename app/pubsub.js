const PubNub = require('pubnub');
const credentials = require('../private/PubNubCredentials');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
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
            this.blockchain.replaceChain(parsedMessage);
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
