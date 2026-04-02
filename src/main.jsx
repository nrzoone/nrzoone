import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log("🚀 BOOTING NRZONE...");

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(<App />);
} else {
    document.body.innerHTML = "<h1>CRITICAL: NO ROOT</h1>";
}

 // Service Worker Disabled
