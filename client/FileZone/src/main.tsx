import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/serviceWorker.js');
    // await navigator.serviceWorker.ready;
}
createRoot(document.getElementById('root')!).render(
    <App />
)
