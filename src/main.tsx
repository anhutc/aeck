import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n/LanguageContext';
import { FeedbackProvider } from './context/FeedbackContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </LanguageProvider>
  </StrictMode>,
);

