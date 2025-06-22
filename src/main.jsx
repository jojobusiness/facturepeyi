import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './Home.jsx';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Home />
    <Analytics/>
    <SpeedInsights/>
  </React.StrictMode>
);