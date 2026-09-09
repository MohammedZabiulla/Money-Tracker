import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initUniversalErrorCapturer } from './utils/errorLogger';
import { UniversalErrorBoundary } from './components/common/UniversalErrorBoundary';

initUniversalErrorCapturer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UniversalErrorBoundary>
      <App />
    </UniversalErrorBoundary>
  </StrictMode>,
);

