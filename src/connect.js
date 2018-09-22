import React from 'react';
import {log} from './log';
const {ipcRenderer} = window.require('electron');


export const connect = stateToPropsMapFn => innerClass => {
  class ConnectClass extends React.Component {

    state = {
      appState: {}
    };
  
    componentDidMount() {
      ipcRenderer.on('state', this.handleStateChange);

      const appState = ipcRenderer.sendSync('request-state');
      this.setState({appState});
    }
  
    componentWillUnmount() {
      ipcRenderer.off('state', this.handleStateChange);
    }

    handleStateChange = (event, appState) => {
      this.setState({appState});
    };
  
    render() {
      const InnerClass = innerClass;

      const props = (stateToPropsMapFn && stateToPropsMapFn(this.state.appState)) || this.state.appState;
  
      return (
        <InnerClass {...props} />
      );
    }
  }

  return ConnectClass;
};

