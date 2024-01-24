import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

console.log('Git hash:', import.meta.env.VITE_GIT_HASH)
console.log('Git time:', import.meta.env.VITE_GIT_DATE)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/oauth-callback',
    loader: ({ request }) => {
      // start an effect that dispatches an action to the store which fetches
      // the token and stores it in .env

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
    element: <div>Retrieving account credentials</div>,
  },
  {
    path: '/trigger-oauth',
    loader: () => {
      globalThis['@@oauth-code'] = (data) =>
        console.log('overridden oauth-code function', data)

      const clientId = 'ac0d0ccdd4fab76ff5d4'
      const scope = encodeURIComponent('user,repo')

      const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`

      openOAuthWindow(oauthUrl, 'Github OAuth')
      return null
    },
    element: <div>test triggering the oauth loop</div>,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

function openOAuthWindow(oauthUrl, name) {
  const width = 600
  const height = 1100
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2
  const windowFeatures = `toolbar=no, menubar=no, width=${width}, height=${height}, top=${top}, left=${left}`

  window.open(oauthUrl, name, windowFeatures)
}
