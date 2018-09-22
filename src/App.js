import React, { Component } from 'react';
import {connect} from './connect';
import CreateTask from './CreateTask';

export default connect(state => ({
  tasks: state.tasks
}))(class App extends Component {

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
  }
});
