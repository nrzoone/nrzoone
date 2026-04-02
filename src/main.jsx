import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log("🚀 NRZONE SYSTEM BOOT SEQUENCE INITIATED");

// Global Emergency Suppression for AbortError and quota issues
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || event;
    const errStr = String(reason?.message || reason?.code || reason || '');
    if (/abort|cancelled|user aborted|timeout|quota|storage/i.test(errStr)) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        return true;
    }
}, true);

try {
    const root = document.getElementById('root');
    if (!root) throw new Error("Root element not found!");
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
} catch (e) {
    console.error("BOOT CRASH:", e);
    document.body.innerHTML = `<div style="background:red; color:white; padding:20px; font-family:sans-serif;"><h1>CRITICAL BOOT ERROR</h1><p>${e.message}</p></div>`;
}

 // Service Worker Disabled
