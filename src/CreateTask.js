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
      <div className="container">
        <div className="row">
          <div className="col-sm">
            <form onSubmit={this.handleSubmit}>
              <div className="form-group">
                <input ref={this.textRef} type="text" className="form-control" placeholder="wot?" />
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
});