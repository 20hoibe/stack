import React from 'react';
import {connect} from './connect';
import * as ipc from './ipc';

export default connect(state => ({
  tasks: state.tasks
}))(class CreateTask extends React.Component {

  createDeleteButton(index) {
    return (
      <button onClick={this.handleDeleteClick} className="btn btn-sm float-right" data-index={index}>Delete</button>
    );
  }

  handleDeleteClick = event => {
    const index = event.target.attributes['data-index'].value;
    ipc.deleteTask(index);
  };

  render() {


    return (
      <div className="container">
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
                content = (<img src={task.payload} />);
                break;
              }
            }

            const classes = `list-group-item ${index === 0 ? 'list-group-item-success' : 'list-group-item-info'}`;

            return (<li className={classes}>{content} {deleteButton}</li>);
          })}
        </ul>
      </div>
    );
  }
});