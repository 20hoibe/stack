import React, { Component } from 'react';
import * as taskActions from './task-actions';
import {connect} from './connect';
import {log} from './log';
const {ipcRenderer} = window.require('electron');

export default connect(state => ({
  tasks: state.tasks
}))(class App extends Component {

  handleClick = () => {
    ipcRenderer.send('task', taskActions.addTextTask('eat cats'));
    log('send "eat cats" task');
  };

  render() {

    return (
      <div>
        <header>
          <h1>Task Stack</h1>
        </header>
        <ul>
          {this.props.tasks && this.props.tasks.map((task, index) => {
            return (
              <li key={index}>{JSON.stringify(task)}</li>
            );
          })}
        </ul>
        <button onClick={this.handleClick}>add eat cats task</button>
      </div>
    );
  }
});