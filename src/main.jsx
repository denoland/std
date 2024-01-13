import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

console.log('Git hash:', import.meta.env.VITE_GIT_HASH)
console.log('Git time:', import.meta.env.VITE_GIT_DATE)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
