import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'

interface FocusContextValue {
  isFocused: boolean
  toggleFocus: () => void
}

const FocusContext = createContext<FocusContextValue>({
  isFocused: false,
  toggleFocus: () => {},
})

export function FocusProvider({ children }: { children: ReactNode }) {
  const [isFocused, setIsFocused] = useState(false)

  const toggleFocus = useCallback(() => {
    setIsFocused((prev) => {
      const next = !prev
      localStorage.setItem('focus-mode', String(next))
      return next
    })
  }, [])

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
  }, [isFocused, toggleFocus])

  return (
    <FocusContext.Provider value={{ isFocused, toggleFocus }}>
      {children}
    </FocusContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFocus() {
  return useContext(FocusContext)
}