import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
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
    
    // Check if we've already reloaded recently to avoid infinite loops
    const lastReload = localStorage.getItem('last_auth_reload');
    const now = Date.now();
    
    if (!lastReload || now - parseInt(lastReload) > 5000) {
      localStorage.setItem('last_auth_reload', now.toString());
      
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      window.location.reload();
    } else {
      console.error('Auth reload loop detected. Stopping reloads.');
    }
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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
