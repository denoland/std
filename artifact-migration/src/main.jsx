import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { loop } from './isolates/oauth'

console.log('Git hash:', import.meta.env.VITE_GIT_HASH)
console.log('Git time:', import.meta.env.VITE_GIT_DATE)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  // these paths only work in testing
  {
    path: '/oauth-callback',
    loader: ({ request }) => {
      const url = new URL(request.url)
      const searchParams = new URLSearchParams(url.search)

      const code = searchParams.get('code')
      if (!code) {
        throw new Error('No code in query string')
      }

      window.opener['@@oauth-code'](code)
      window.close()
      return null
    },
    element: null,
  },
  {
    path: '/trigger-oauth',
    loader: loop,
    element: null,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
