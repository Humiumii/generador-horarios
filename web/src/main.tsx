import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-semi-condensed/700.css'
import { App } from './App'
import './style.css'

createRoot(document.getElementById('root')!).render(<App />)

