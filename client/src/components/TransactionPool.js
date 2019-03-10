import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Transaction from './Transaction';
import { TRANSACTION_POOL_MAP_URI } from '../../../routes';

export default class TransactionPool extends Component {
  state = { transactionPoolMap: {} };

  componentDidMount() {
    this.fetchTransactionPoolMap();
  }

  fetchTransactionPoolMap = () => {
    fetch(TRANSACTION_POOL_MAP_URI)
    .then(response => response.json())
    .then(json => this.setState({ transactionPoolMap: json }));
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
      </div>
    );
  }
}
