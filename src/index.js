import {h, render} from 'preact';
import App from './App';
import './index.css';

const root = document.getElementById('root');
// lastChild is important to not append
render(<App />, root, root.lastChild);

if (module.hot) {
  module.hot.accept();
}