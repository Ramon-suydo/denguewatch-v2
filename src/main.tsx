import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Intentionally empty: dataset verification precedes UI implementation.
createRoot(document.getElementById('root')!).render(<StrictMode>{null}</StrictMode>);
