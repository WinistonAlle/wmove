import { createContext, useContext, useState, useCallback } from 'react'
import '../styles/toast.css'

const Ctx = createContext(() => {})
let uid = 0

export function ToastProvider({ children }) {
  const [list, setList] = useState([])

  const remove = useCallback(id => setList(p => p.filter(t => t.id !== id)), [])

  const toast = useCallback((msg, type = 'success') => {
    const id = ++uid
    setList(p => [...p.slice(-3), { id, msg, type }])
    setTimeout(() => remove(id), 3400)
  }, [remove])

  return (
    <Ctx.Provider value={toast}>
      {children}
      {list.length > 0 && (
        <div className="toast-list">
          {list.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
              <div className="toast-icon">
                {t.type === 'success' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : t.type === 'error' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
              </div>
              <span className="toast-msg">{t.msg}</span>
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
