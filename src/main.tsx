import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle Supabase refresh token errors globally
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || '';
  if (
    errorMessage.includes('Refresh Token Not Found') || 
    errorMessage.includes('invalid_refresh_token') ||
    errorMessage.includes('Refresh Token is invalid') ||
    errorMessage.includes('session_not_found')
  ) {
    console.warn('Auth refresh token error detected, clearing session...');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Don't reload automatically to avoid loops, just let the app handle the null user
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('CashLuanda PWA registered: ', registration);
      })
      .catch(registrationError => {
        console.log('PWA registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
