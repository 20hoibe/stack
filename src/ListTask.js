import {h, Component} from 'preact';
import {connect} from './connect';
import * as ipc from './ipc';

const progressBarStyle = {
  width: '100%'
};

export default connect(state => ({
  tasks: state.tasks
}))(class CreateTask extends Component {

  state = {
    deleter: undefined
  };

  componentWillUnmount() {
    this.handleDelete();
  }

  createDeleteButton(index) {
    return (
      <button onClick={this.handleDeleteClick} class="btn btn-sm btn-danger float-right" data-index={index}>Delete</button>
    );
  }

  handleDelete = async () => {
    if (!this.state.deleter) {
      return;
    }

    this.state.deleter.callback();
    clearTimeout(this.state.deleter.timeout);
    
    await new Promise(resolve => {
      this.setState({deleter: undefined}, resolve);
    });
  };

  handleDeleteClick = async event => {
    
    // event is a proxy: extract index first!
    const index = +event.target.attributes['data-index'].value;
    
    // delete outstanding item
    await this.handleDelete();

    this.setState({deleter: {
      index,
      timeout: setTimeout(this.handleDelete, 300),
      callback: () => {
        ipc.deleteTask(index);
      }
    }});
  };

  render() {
    return (
      <div>
        <h5>Task List</h5>
        <ul class="list-group">
          {this.props.tasks && this.props.tasks.map((task, index) => {
            const deleteButton = this.createDeleteButton(index);

            let content;
            switch (task.type) {
            case 'text': {
              content = task.payload;
              break;
            }
            case 'image': {
              content = (<img src={task.payload} class="img-thumbnail" />);
              break;
            }
            }

            const classes = `list-group-item list-group-item-action ${index === 0 ? 'active' : ''} ${(index === (this.state.deleter && this.state.deleter.index)) ? 'fade-out' : ''}`;

            return (
              <li key={task.id} class={classes}>
                <div class="row">
                  <div class="col-8">{index+1}. {content}</div>
                  <div class="col-4">{deleteButton}</div>
                </div>
                {index === 0 && (
                  <div class="progress mt-3">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" style={progressBarStyle} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
});