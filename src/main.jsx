import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppProvider } from './context/AppContext';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático del Service Worker para PWA y soporte Offline
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible en segundo plano');
  },
  onOfflineReady() {
    console.log('✅ Obra Control está lista para funcionar 100% sin conexión a internet.');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);

