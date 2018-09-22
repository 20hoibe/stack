import React from 'react';
import {connect} from './connect';
import * as ipc from './ipc';

export default connect()(class CreateTask extends React.Component {
  
  textRef = React.createRef();

  componentDidMount() {
    if (this.textRef.current) {
      this.textRef.current.focus();
    }
  }

  handleSubmit = event => {
    event.preventDefault();

    if (!this.textRef.current) {
      return;
    }

    const text = this.textRef.current.value;
    ipc.addTextTask(text);
    ipc.closeWindow();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <input ref={this.textRef} type="text" placeholder="wot?" />
          <button type="submit">Save</button>
        </div>
      </form>
    );
  }
});