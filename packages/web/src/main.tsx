import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/scrollbar.css'
import { globalStyles } from './styles/stitches.config'
import App from './App.tsx'

// 应用全局样式
globalStyles();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
