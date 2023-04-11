// @ts-ignore
import Content from './content.md';
// @ts-ignore
import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';

import { getComponents } from './components'

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <Content components={getComponents()}/>
  </React.StrictMode>
);