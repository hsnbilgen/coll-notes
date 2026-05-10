import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FocusProvider } from '@/context/FocusContext'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { SharedDocumentPage } from '@/pages/SharedDocumentPage'
import { getToken } from '@/lib/auth'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState(() => !!getToken())

  useEffect(() => {
    const check = () => setHasToken(!!getToken())
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  return hasToken ? <>{children}</> : <Navigate to="/login" replace />
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
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <WorkspacePage />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </FocusProvider>
    </QueryClientProvider>
  )
}
