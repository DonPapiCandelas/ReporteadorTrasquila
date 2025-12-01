import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log("Main.tsx: Starting...");
try {
  const rootElement = document.getElementById('root');
  console.log("Main.tsx: Root element:", rootElement);

  if (!rootElement) {
    console.error("Main.tsx: FATAL - Root element not found!");
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log("Main.tsx: Render called");
  }
} catch (error) {
  console.error("Main.tsx: Error during render:", error);
}
