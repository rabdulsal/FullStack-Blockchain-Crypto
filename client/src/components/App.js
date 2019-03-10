import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { WALLET_INFO_PATH } from '../../../routes';

class App extends Component {
  state = { walletInfo: {} };

  componentDidMount() {
    fetch(`${document.location.origin}${WALLET_INFO_PATH}`)
    .then(response => response.json())
    .then(json => this.setState({ walletInfo: json }));
  }

  render() {
    const { address, balance } = this.state.walletInfo;

    return (
      <div className='App'>
        <img className='logo' src={logo}></img>
        <br />
        <div>
          Welcome to the blockchain....
        </div>
        <br />
        <div><Link to='/blocks'>Blocks</Link></div>
        <div><Link to='/conduct-transaction'>Make Transaction</Link></div>
        <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
        <br />
        <div className='WalletInfo'>
          <div>Address: {address}</div>
          <div>Balance: {balance}</div>
        </div>
      </div>
    );
  }
}

export default App;
