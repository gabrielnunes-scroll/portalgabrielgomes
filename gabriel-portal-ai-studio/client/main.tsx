import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import '../shared/app/globals.css';
import './auth.css';
createRoot(document.getElementById('root')!).render(<App/>);
