import React from 'react';
import {connect} from './connect';
import * as ipc from './ipc';

export default connect()(class CreateTask extends React.Component {
  
  textRef = React.createRef();

  componentDidMount() {
    if (this.textRef.current) {
      this.textRef.current.focus();
    }

    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      ipc.closeWindow();
    }
  };

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
      <div className="container">
        <h5>Add Task</h5>
        <form onSubmit={this.handleSubmit}>
          <div className="input-group">
            <input ref={this.textRef} type="text" className="form-control" placeholder="wot?" />
            <div class="input-group-append">
              <button type="submit" class="btn btn-primary btn-outline-secondary">Save</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
});