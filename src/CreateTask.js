import {h, Component} from 'preact';
import {connect} from './connect';
import * as ipc from './ipc';

export default connect()(class CreateTask extends Component {
  
  textRef = undefined;

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);

    if (this.textRef) {
      this.textRef.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      ipc.closeWindow();
    }
  };

  handleRefText = ref => {
    this.textRef = ref;
  };

  handleSubmit = event => {
    event.preventDefault();

    if (!this.textRef) {
      return;
    }

    const text = this.textRef.value;
    ipc.addTextTask(text);
    ipc.closeWindow();
  };

  render() {
    return (
      <div class="container">
        <h5>Add Task</h5>
        <form onSubmit={this.handleSubmit}>
          <div class="input-group">
            <input ref={this.handleRefText} type="text" class="form-control" placeholder="wot?" />
            <div class="input-group-append">
              <button type="submit" class="btn btn-primary btn-outline-secondary">Save</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
});