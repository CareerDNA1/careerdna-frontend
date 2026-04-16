// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import './styles/Variables.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);