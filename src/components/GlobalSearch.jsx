import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/search.css'

const STATUS_MAP = {
  available:   'disponível',
  rented:      'alugado',
  maintenance: 'oficina',
  inactive:    'inativo',
}

function maskCPF(v) {
  if (!v) return ''
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function GlobalSearch({ open, onClose }) {
  const [q, setQ] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQ('')
      setVehicles([])
      setCustomers([])
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose() }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setVehicles([]); setCustomers([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const [{ data: v }, { data: c }] = await Promise.all([
        supabase.from('vehicles').select('id, plate, brand, model, status')
          .or(`plate.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%`).limit(5),
        supabase.from('customers').select('id, name, cpf, phone')
          .or(`name.ilike.%${term}%,cpf.ilike.%${term}%`).limit(5),
      ])
      setVehicles(v || [])
      setCustomers(c || [])
      setSel(0)
      setLoading(false)
    }, 180)
    return () => clearTimeout(t)
  }, [q])

  const all = [
    ...vehicles.map(v => ({ kind: 'vehicle', ...v })),
    ...customers.map(c => ({ kind: 'customer', ...c })),
  ]

  function go(item) {
    navigate(item.kind === 'vehicle' ? '/frota' : '/clientes')
    onClose()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, all.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && all[sel]) go(all[sel])
  }

  if (!open) return null

  const hasResults = vehicles.length > 0 || customers.length > 0
  const showDropdown = q.trim().length > 0

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Buscar placa, veículo, cliente…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {loading && <div className="search-spinner" />}
          <kbd className="search-esc-key" onClick={onClose}>Esc</kbd>
        </div>

        {showDropdown && (
          <div className="search-results">
            {!loading && !hasResults && (
              <div className="search-empty">Nenhum resultado para <strong>"{q}"</strong></div>
            )}

            {vehicles.length > 0 && (
              <div className="search-group">
                <div className="search-group-label">Veículos</div>
                {vehicles.map((v, i) => (
                  <div
                    key={v.id}
                    className={`search-row${sel === i ? ' active' : ''}`}
                    onClick={() => go({ kind: 'vehicle', ...v })}
                    onMouseEnter={() => setSel(i)}
                  >
                    <div className="search-row-icon vehicle-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13h14l-1.4-4.2a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.3L5 13z"/>
                        <rect x="3.5" y="13" width="17" height="4" rx="1.2"/>
                        <circle cx="7.5" cy="17.5" r="1.2"/>
                        <circle cx="16.5" cy="17.5" r="1.2"/>
                      </svg>
                    </div>
                    <div className="search-row-body">
                      <span className="search-row-title">{v.brand} {v.model}</span>
                      <span className="search-row-sub">{STATUS_MAP[v.status] || v.status}</span>
                    </div>
                    <span className="plate" style={{ fontSize: 11 }}>{v.plate}</span>
                  </div>
                ))}
              </div>
            )}

            {customers.length > 0 && (
              <div className="search-group">
                <div className="search-group-label">Clientes</div>
                {customers.map((c, i) => {
                  const idx = vehicles.length + i
                  return (
                    <div
                      key={c.id}
                      className={`search-row${sel === idx ? ' active' : ''}`}
                      onClick={() => go({ kind: 'customer', ...c })}
                      onMouseEnter={() => setSel(idx)}
                    >
                      <div className="search-row-icon customer-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6.5 7-6.5s7 2.9 7 6.5"/>
                        </svg>
                      </div>
                      <div className="search-row-body">
                        <span className="search-row-title">{c.name}</span>
                        {c.cpf && <span className="search-row-sub">{maskCPF(c.cpf)}</span>}
                      </div>
                      {c.phone && <span className="search-row-phone">{c.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="search-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>⌘K</kbd> fechar</span>
        </div>
      </div>
    </div>
  )
}
