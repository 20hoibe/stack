import React from 'react';
const {ipcRenderer, remote} = window.require('electron');

const id = remote.getCurrentWindow().id;

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
      const {appState} = this.state;

      const props = (stateToPropsMapFn && stateToPropsMapFn(appState)) || {};

      props.windowState = appState && appState.windowStates && appState.windowStates[id];
  
      return (
        <InnerClass {...props} />
      );
    }
  }

  return ConnectClass;
};

