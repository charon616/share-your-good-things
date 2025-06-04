import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { DAppKitProvider } from '@vechain/dapp-kit-react';
import { THOR_URL } from './config/constants';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DAppKitProvider node={THOR_URL}>
      <App />
    </DAppKitProvider>
  </StrictMode>,
)
