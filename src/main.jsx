import App from './App'
import { AuthProvider } from './context/AuthContext';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Analytics/>
      <SpeedInsights/>
    </AuthProvider>
  </BrowserRouter>
);