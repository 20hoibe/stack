import {h, Component} from 'preact';
const {ipcRenderer} = window.require('electron');
import './About.css';
import * as ipc from './ipc';

const TIME_PER_STACK_ELEMENT = 400;

export default class About extends Component {

  constructor(props) {
    super(props);
    ipcRenderer.on('show', () => {
      this.showStack();
    });
    ipcRenderer.on('hide', () => {
      this.hideStack();
    });
  }
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.showStack();
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      ipc.closeWindow();
    }
  };

  showStack() {
    const boxes = document.getElementsByClassName('stack');
    for (let idx = 0; idx < boxes.length; ++idx) {
      const box = document.getElementById(`elem${idx}`);
      setTimeout(() => {
        box.classList.add('stacked');
      }, idx * TIME_PER_STACK_ELEMENT);
    }
  }

  hideStack() {
    const boxes = document.getElementsByClassName('stack');
    for (let idx = 0; idx < boxes.length; ++idx) {
      boxes[idx].classList.remove('stacked');
    }
  }

  render() {
    return (
      <div class="stack-container">
        <div class="stack-background">
          <span id="elem0" class="stack first" />
          <span id="elem1" class="stack second" />
          <span id="elem2" class="stack third" />
          <span id="elem3" class="stack fourth" />
        </div>
        <h5 class="centered">{process.env.npm_package_build_copyright}</h5>
        <h5 class="centered">v{process.env.npm_package_version}</h5>
        <h5 class="centered">Find us on</h5>
        <h5 class="centered"><a href="https://github.com/20hoibe" target="_blank">Github</a></h5>
        <h5 class="centered"><a href="https://twitter.com/20hoibe" target="_blank">Twitter</a></h5>
        <h5 class="centered"><a href="https://medium.com/20hoibe" target="_blank">Medium</a></h5>
      </div>
    );
  }
}
