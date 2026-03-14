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
    // Optional: reload to clear memory state
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
