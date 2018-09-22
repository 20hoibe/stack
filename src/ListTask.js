import React from 'react';
import {connect} from './connect';

export default connect(state => ({
  tasks: state.tasks
}))(class CreateTask extends React.Component {

  render() {
    return (
      <div className="container">
        <ul class="list-group">
          {this.props.tasks && this.props.tasks.map(task => {
            switch (task.type) {
              case 'text': {
                return (<li className="list-group-item list-group-item-secondary">{task.payload}</li>);
              }
              case 'image': {
                return (<li className="list-group-item">Image</li>);
              }
            }
          })}
        </ul>
      </div>
    );
  }
});