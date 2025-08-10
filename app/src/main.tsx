import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Tailwind CSS imported here
import '@solana/wallet-adapter-react-ui/styles.css'; // for default UI styling
import {Providers} from "./Providers.tsx"


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
    <App />
     </Providers>
  </StrictMode>,
)
