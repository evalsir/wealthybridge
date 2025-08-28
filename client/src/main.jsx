import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './assets/translations/en.json';
import sw from './assets/translations/sw.json';
import ar from './assets/translations/ar.json';
import zh from './assets/translations/zh.json';
import es from './assets/translations/es.json';
import nl from './assets/translations/nl.json';
import ja from './assets/translations/ja.json';
import pl from './assets/translations/pl.json';
import fr from './assets/translations/fr.json';
import App from './App.jsx';
import './index.css';

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sw: { translation: sw },
    ar: { translation: ar },
    zh: { translation: zh },
    es: { translation: es },
    nl: { translation: nl },
    ja: { translation: ja },
    pl: { translation: pl },
    fr: { translation: fr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
