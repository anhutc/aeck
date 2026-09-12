import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n/LanguageContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <FeedbackProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </FeedbackProvider>
    </LanguageProvider>
  </StrictMode>,
);

