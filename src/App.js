import React, { Component } from 'react';
import {connect} from './connect';
import {log} from './log';
import CreateTask from './CreateTask';
const {ipcRenderer} = window.require('electron');

export default connect(state => ({
  tasks: state.tasks
}))(class App extends Component {

<<<<<<< 045d6a87f90873f02bb4fc2b6591e55cf293db33
  handleClick = () => {
    ipcRenderer.send('task', taskActions.addTextTask('eat cats'));
    log('send "eat cats" task');
  };

  pushTask = () => {
    ipcRenderer.send('push', {
      title: "foo",
      payload: "bar"
    });
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
        <button onClick={this.pushTask}>add task</button>
      </div>
    );
=======
  render() {
    const {type} = (this.props && this.props.windowState) || {};
    switch (type) {
      case 'create-task': {
        return (<CreateTask />);
      }
      default: {
        return 'unknown type';
      }
    }
>>>>>>> create task
  }
});
