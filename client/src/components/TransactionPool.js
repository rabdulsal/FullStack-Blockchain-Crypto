import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import history from '../history';
import Transaction from './Transaction';
import {
  TRANSACTION_POOL_MAP_PATH,
  MINE_TRANSACTIONS_PATH,
} from '../../../routes';

const POLL_INTERVAL_MS = 10000;

export default class TransactionPool extends Component {
  state = { transactionPoolMap: {} };

  componentDidMount() {
    this.fetchTransactionPoolMap();

    this.fetchPoolMapInterval = setInterval(
      () => this.fetchTransactionPoolMap(),
     POLL_INTERVAL_MS
   );
  }

  componentWillUnMount() {
     clearInterval(this.fetchPoolMapInterval);
  }

  fetchTransactionPoolMap = () => {
    fetch(`${document.location.origin}${TRANSACTION_POOL_MAP_PATH}`)
    .then(response => response.json())
    .then(json => this.setState({ transactionPoolMap: json }));
  }

  fetchMineTransactions = () => {
    fetch(`${document.location.origin}${MINE_TRANSACTIONS_PATH}`)
    .then(response => {
      if (response.status === 200) {
        alert('success');
        history.push('./blocks');
      } else {
        alert('The mine-transactions block request did not complete.');
      }
    });
  }

  render() {
    return (
      <div className='TransactionPool'>
        <div><Link to='/'>Home</Link></div>
        <h3>Transaction Pool</h3>
        {
          Object.values(this.state.transactionPoolMap).map(transaction => (
            <div key={transaction.id}>
              <hr />
              <Transaction transaction={transaction} />
            </div>
          ))
        }
        <hr />
        <Button
          bsStyle='danger'
          onClick={this.fetchMineTransactions}
        >
          Mine the Transactions
        </Button>
      </div>
    );
  }
}
