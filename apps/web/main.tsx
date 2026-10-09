import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadSchoolDatabase } from '@school-intel/api';
import { Root } from './Root';
import './boot.css';

const mount = document.getElementById('root')!;
const root = createRoot(mount);

function Failed({ message }: { message: string }) {
  return (
    <div className="boot" role="alert">
      <span className="boot-mark" aria-hidden><i /><i /><i /></span>
      <h1>We could not open the school database</h1>
      <p>{message}</p>
      <button type="button" onClick={() => location.reload()}>Try again</button>
    </div>
  );
}

// The school database is a file served with the app. Read it once, then show the app.
loadSchoolDatabase()
  .then(() => root.render(<StrictMode><Root /></StrictMode>))
  .catch((e: unknown) => root.render(<Failed message={e instanceof Error ? e.message : 'Something went wrong while reading the file.'} />));

// Offline shell only: the service worker caches static assets, never student records or case data.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}
