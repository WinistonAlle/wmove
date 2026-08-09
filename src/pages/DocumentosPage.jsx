import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import '../styles/documentos.css'

const DOC_TYPES = [
  { value: 'crlv',       label: 'CRLV',       color: '#6366f1' },
  { value: 'cnh',        label: 'CNH',        color: '#0ea5e9' },
  { value: 'contract',   label: 'Contrato',   color: '#10b981' },
  { value: 'insurance',  label: 'Seguro',     color: '#f59e0b' },
  { value: 'fine',       label: 'Multa',      color: '#ef4444' },
  { value: 'inspection', label: 'Vistoria',   color: '#8b5cf6' },
  { value: 'other',      label: 'Outro',      color: '#6b7280' },
]

const TYPE_MAP = Object.fromEntries(DOC_TYPES.map(t => [t.value, t]))

const FILTER_TABS = ['Todos', ...DOC_TYPES.map(t => t.label)]

const BLANK = {
  name: '', doc_type: 'crlv', vehicle_id: '', customer_id: '',
  rental_id: '', notes: '', expires_at: '',
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function daysDiff(str) {
  if (!str) return null
  const d = new Date(str)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 86400000)
}

function ExpiryBadge({ date }) {
  if (!date) return null
  const diff = daysDiff(date)
  if (diff < 0)    return <span className="doc-expiry expired">Vencido</span>
  if (diff <= 30)  return <span className="doc-expiry expiring">Vence em {diff}d</span>
  return <span className="doc-expiry ok">{fmtDate(date)}</span>
}

function FileIcon({ mime }) {
  if (!mime) return <IconFile />
  if (mime.startsWith('image/'))       return <IconImage />
  if (mime === 'application/pdf')      return <IconPdf />
  return <IconFile />
}

const IconPdf   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6M9 9h1"/></svg>
const IconImage = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
const IconFile  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>
const IconUpload = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const IconTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
const IconDown  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>

export default function DocumentosPage() {
  const { userData } = useUser()
  const companyId = userData?.company?.id

  const [docs, setDocs]         = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('Todos')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(BLANK)
  const [file, setFile]         = useState(null)
  const [saving, setSaving]     = useState(false)
  const [drag, setDrag]         = useState(false)
  const fileRef = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: d }, { data: v }, { data: c }] = await Promise.all([
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('id, plate, model'),
      supabase.from('customers').select('id, full_name'),
    ])
    setDocs(d ?? [])
    setVehicles(v ?? [])
    setCustomers(c ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── derived stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const total    = docs.length
    const expiring = docs.filter(d => { const diff = daysDiff(d.expires_at); return diff !== null && diff >= 0 && diff <= 30 }).length
    const expired  = docs.filter(d => { const diff = daysDiff(d.expires_at); return diff !== null && diff < 0 }).length
    return { total, expiring, expired }
  }, [docs])

  const filtered = useMemo(() => {
    let list = docs
    if (tab !== 'Todos') {
      const typeVal = DOC_TYPES.find(t => t.label === tab)?.value
      if (typeVal) list = list.filter(d => d.doc_type === typeVal)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.file_name?.toLowerCase().includes(q) ||
        vehicles.find(v => v.id === d.vehicle_id)?.plate?.toLowerCase().includes(q) ||
        customers.find(c => c.id === d.customer_id)?.full_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [docs, tab, search, vehicles, customers])

  // ── upload ─────────────────────────────────────────────
  function openModal() {
    setForm(BLANK)
    setFile(null)
    setModal(true)
  }

  function onFilePick(picked) {
    if (!picked) return
    setFile(picked)
    if (!form.name) setForm(f => ({ ...f, name: picked.name.replace(/\.[^.]+$/, '') }))
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    const picked = e.dataTransfer.files[0]
    if (picked) onFilePick(picked)
  }

  async function handleSave() {
    if (!file || !form.name || !companyId) return
    setSaving(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${companyId}/${form.doc_type}/${Date.now()}_${file.name}`

      const { error: storageErr } = await supabase.storage
        .from('wmove-docs').upload(path, file)
      if (storageErr) throw storageErr

      const { error: dbErr } = await supabase.from('documents').insert({
        company_id:  companyId,
        vehicle_id:  form.vehicle_id  || null,
        customer_id: form.customer_id || null,
        rental_id:   form.rental_id   || null,
        name:        form.name,
        doc_type:    form.doc_type,
        file_path:   path,
        file_name:   file.name,
        file_size:   file.size,
        mime_type:   file.type,
        notes:       form.notes       || null,
        expires_at:  form.expires_at  || null,
      })
      if (dbErr) throw dbErr

      setModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDownload(doc) {
    const { data, error } = await supabase.storage
      .from('wmove-docs').createSignedUrl(doc.file_path, 3600)
    if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Excluir "${doc.name}"?`)) return
    await supabase.storage.from('wmove-docs').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    load()
  }

  const vehiclePlate = (id) => vehicles.find(v => v.id === id)?.plate
  const customerName = (id) => customers.find(c => c.id === id)?.full_name

  return (
    <DashboardLayout
      topbarLeft={<h1 className="page-title">Documentos</h1>}
      topbarRight={
        <button className="btn-add" onClick={openModal}>
          <IconUpload /> Enviar documento
        </button>
      }
    >
      <div className="page-content">

        {/* KPIs */}
        <div className="doc-kpis">
          <div className="metric-card">
            <span className="metric-val">{loading ? '—' : stats.total}</span>
            <span className="metric-label">Total</span>
          </div>
          <div className="metric-card">
            <span className="metric-val" style={{ color: 'var(--amber)' }}>{loading ? '—' : stats.expiring}</span>
            <span className="metric-label">Vencendo em 30d</span>
          </div>
          <div className="metric-card">
            <span className="metric-val" style={{ color: 'var(--danger)' }}>{loading ? '—' : stats.expired}</span>
            <span className="metric-label">Vencidos</span>
          </div>
          <div className="metric-card">
            <span className="metric-val">{loading ? '—' : DOC_TYPES.length}</span>
            <span className="metric-label">Categorias</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="period-tabs" style={{ marginBottom: 0, flex: 1, flexWrap: 'wrap' }}>
            {FILTER_TABS.map(t => (
              <button
                key={t}
                className={`period-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            className="search-input"
            placeholder="Buscar documento…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="loading-state">Carregando documentos…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum documento{tab !== 'Todos' ? ` do tipo "${tab}"` : ''} encontrado.</p>
          </div>
        ) : (
          <div className="doc-grid">
            {filtered.map(doc => {
              const typeInfo = TYPE_MAP[doc.doc_type] ?? TYPE_MAP.other
              const plate    = vehiclePlate(doc.vehicle_id)
              const cname    = customerName(doc.customer_id)
              return (
                <div key={doc.id} className="doc-card">
                  <div className="doc-card-top">
                    <div className="doc-file-icon" style={{ color: typeInfo.color, background: typeInfo.color + '18' }}>
                      <FileIcon mime={doc.mime_type} />
                    </div>
                    <div className="doc-actions">
                      <button className="doc-action-btn" title="Baixar" onClick={() => handleDownload(doc)}>
                        <IconDown />
                      </button>
                      <button className="doc-action-btn danger" title="Excluir" onClick={() => handleDelete(doc)}>
                        <IconTrash />
                      </button>
                    </div>
                  </div>

                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-filename">{doc.file_name}</div>

                  <div className="doc-tags">
                    <span className="doc-type-pill" style={{ color: typeInfo.color, background: typeInfo.color + '18' }}>
                      {typeInfo.label}
                    </span>
                    {plate && <span className="doc-ref-pill">{plate}</span>}
                    {cname && <span className="doc-ref-pill">{cname}</span>}
                  </div>

                  <div className="doc-footer">
                    <span className="doc-size">{fmtSize(doc.file_size)}</span>
                    <ExpiryBadge date={doc.expires_at} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Upload modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title="Enviar documento">
        {/* Drop zone */}
        <div
          className={`doc-drop-zone${drag ? ' dragging' : ''}${file ? ' has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            style={{ display: 'none' }}
            onChange={e => onFilePick(e.target.files[0])}
          />
          {file ? (
            <>
              <div className="drop-file-icon"><FileIcon mime={file.type} /></div>
              <p className="drop-file-name">{file.name}</p>
              <p className="drop-file-size">{fmtSize(file.size)}</p>
            </>
          ) : (
            <>
              <IconUpload />
              <p>Arraste um arquivo ou <span>clique para selecionar</span></p>
              <small>PDF, imagens, Word — até 20 MB</small>
            </>
          )}
        </div>

        <div className="modal-form-grid">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Nome do documento *</label>
            <input
              className="form-input"
              placeholder="Ex.: CRLV 2026 — Fiat Strada"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Tipo *</label>
            <select className="form-input" value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Validade</label>
            <input
              type="date"
              className="form-input"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Veículo</label>
            <select className="form-input" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">— nenhum —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Cliente</label>
            <select className="form-input" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
              <option value="">— nenhum —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Observações</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving || !file || !form.name}
          >
            {saving ? 'Enviando…' : 'Enviar documento'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
