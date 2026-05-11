import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FocusProvider } from '@/context/FocusContext'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { SharedDocumentPage } from '@/pages/SharedDocumentPage'
import { getToken, decodeUser } from '@/lib/auth'

const queryClient = new QueryClient()

function isValidToken() {
  const token = getToken()
  if (!token) return false
  return decodeUser(token) !== null  // returns null if expired or malformed
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [valid, setValid] = useState(() => isValidToken())

  useEffect(() => {
    const check = () => setValid(isValidToken())
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  return valid ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FocusProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/share/:token" element={<SharedDocumentPage />} />
            <Route path="/" element={<PrivateRoute><WorkspacePage /></PrivateRoute>} />
            <Route path="/documents/:id" element={<PrivateRoute><WorkspacePage /></PrivateRoute>} />
            <Route path="/shared/:token" element={<PrivateRoute><WorkspacePage /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </FocusProvider>
    </QueryClientProvider>
  )
}
