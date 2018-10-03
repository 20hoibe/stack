import {h, Component } from 'preact';
import {connect} from './connect';
import CreateTask from './CreateTask';
import ListTask from './ListTask';
import About from './About';

export default connect(state => ({
  tasks: state.tasks
}))(class App extends Component {

  render() {
    const {type} = (this.props && this.props.windowState) || {};
    switch (type) {
    case 'create-task': {
      return (<CreateTask />);
    }
    case 'list-task': {
      return (<ListTask />);
    }
    case 'about': {
      return (<About />);
    }
    default: {
      return 'unknown type';
    }
    }
  }
});
