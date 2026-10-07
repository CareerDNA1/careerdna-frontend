// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './pages/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Outermost boundary: a crash anywhere, including auth or routing setup,
        shows the calm error card instead of a blank page. The boundary inside
        App still catches page-level errors and keeps the navigation alive. */}
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);