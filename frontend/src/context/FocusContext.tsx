import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface FocusContextValue {
  isFocused: boolean
  toggleFocus: () => void
}

const FocusContext = createContext<FocusContextValue>({
  isFocused: false,
  toggleFocus: () => {},
})

export function FocusProvider({ children }: { children: ReactNode }) {
  const [isFocused, setIsFocused] = useState(() => {
    return localStorage.getItem('focus-mode') === 'true'
  })

  const toggleFocus = () => {
    setIsFocused((prev) => {
      const next = !prev
      localStorage.setItem('focus-mode', String(next))
      return next
    })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        toggleFocus()
      }
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false)
        localStorage.setItem('focus-mode', 'false')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFocused])

  return (
    <FocusContext.Provider value={{ isFocused, toggleFocus }}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  return useContext(FocusContext)
}