import { createRoot } from 'react-dom/client'
import App from './App'

// No StrictMode — it double-mounts effects which creates
// duplicate physics character controllers causing stutter
createRoot(document.getElementById('root')!).render(<App />)
