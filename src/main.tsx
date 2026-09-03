import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { defineCustomElements } from '@ionic/pwa-elements/loader';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Call the element loader before the render call
defineCustomElements(window);
