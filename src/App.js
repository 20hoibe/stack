import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
const {ipcRenderer, remote} = window.require('electron');

class App extends Component {
  handleClick = () => {
    ipcRenderer.send('async', 1);
    
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          <button onClick={this.handleClick}>tray</button>
        </p>
      </div>
    );
  }
}

export default App;
