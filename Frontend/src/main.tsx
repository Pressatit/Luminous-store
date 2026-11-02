import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {App}  from "@/App"
import { ShiftProvider } from './context/shiftcontext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShiftProvider>
    <App />
    </ShiftProvider>
  </StrictMode>,
)
