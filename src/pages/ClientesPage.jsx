import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import '../styles/inner.css'
import '../styles/clientes.css'

const PAGE_SIZE = 20

// ─── Constants ───────────────────────────────────────────────

const BLANK = {
  name: '', cpf: '', email: '', phone: '',
  cnh: '', cnh_expiry: '', address: '',
  score: '100', blacklisted: false, notes: '',
}

// ─── Helpers ─────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return 'var(--emerald)'
  if (score >= 50) return 'var(--accent)'
  return 'var(--danger)'
}

function scoreLabel(score) {
  if (score >= 80) return 'Confiável'
  if (score >= 50) return 'Regular'
  return 'Alto risco'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function cnhAlert(expiry) {
  if (!expiry) return null
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000)
  if (days < 0) return { cls: 'badge shop', label: 'CNH vencida' }
  if (days <= 60) return { cls: 'badge rented', label: `Vence em ${days}d` }
  return null
}

function maskCPF(v) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)
}

function maskPhone(v) {
  return v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)
}

// ─── Component ───────────────────────────────────────────────

export default function ClientesPage() {
  const { userData } = useUser()
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*, rentals(id)')
      .order('name')
    setCustomers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Modal ────────────────────────────────────────────────

  function openAdd() {
    setEditing(null)
    setForm(BLANK)
    setError('')
    setDeletingId(null)
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditing(c)
    setForm({
      name:        c.name,
      cpf:         c.cpf         || '',
      email:       c.email       || '',
      phone:       c.phone       || '',
      cnh:         c.cnh         || '',
      cnh_expiry:  c.cnh_expiry  || '',
      address:     c.address     || '',
      score:       c.score?.toString() ?? '100',
      blacklisted: c.blacklisted ?? false,
      notes:       c.notes       || '',
    })
    setError('')
    setDeletingId(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setDeletingId(null)
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  // ── CRUD ────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name:        form.name.trim(),
      cpf:         form.cpf.replace(/\D/g, '') || null,
      email:       form.email.trim() || null,
      phone:       form.phone.replace(/\D/g, '') || null,
      cnh:         form.cnh.trim()  || null,
      cnh_expiry:  form.cnh_expiry  || null,
      address:     form.address.trim() || null,
      score:       parseInt(form.score) || 100,
      blacklisted: form.blacklisted,
      notes:       form.notes.trim() || null,
      company_id:  userData.company.id,
    }

    let err
    if (editing) {
      ;({ error: err } = await supabase.from('customers').update(payload).eq('id', editing.id))
    } else {
      ;({ error: err } = await supabase.from('customers').insert(payload))
    }

    setSaving(false)
    if (err) {
      if (err.message.includes('cpf')) setError('CPF já cadastrado.')
      else if (err.message.includes('email')) setError('E-mail já cadastrado.')
      else setError(err.message)
      return
    }
    toast(editing ? 'Cliente atualizado.' : 'Cliente cadastrado.')
    closeModal()
    load()
  }

  async function handleDelete(id) {
    const { error: err } = await supabase.from('customers').delete().eq('id', id)
    if (err) {
      setError('Não foi possível remover. Verifique se há locações vinculadas.')
      setDeletingId(null)
      return
    }
    toast('Cliente removido.', 'info')
    closeModal()
    load()
  }

  // ── Filtering ────────────────────────────────────────────

  const byFilter = filter === 'all'
    ? customers
    : filter === 'blocked'
    ? customers.filter(c => c.blacklisted)
    : customers.filter(c => !c.blacklisted)

  const filtered = search.trim()
    ? byFilter.filter(c =>
        `${c.name} ${c.cpf || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : byFilter
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    all:     customers.length,
    active:  customers.filter(c => !c.blacklisted).length,
    blocked: customers.filter(c => c.blacklisted).length,
  }

  // ── Render ───────────────────────────────────────────────

  const topbarLeft = (
    <div className="greet">
      <h1>Clientes</h1>
      <p>{loading ? '…' : `${customers.length} cliente${customers.length !== 1 ? 's' : ''} cadastrado${customers.length !== 1 ? 's' : ''}`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Novo cliente
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* Toolbar */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'all',     label: 'Todos',     count: counts.all     },
            { key: 'active',  label: 'Ativos',    count: counts.active  },
            { key: 'blocked', label: 'Bloqueados', count: counts.blocked },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-tab${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="filter-count">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="page-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando clientes…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {customers.length === 0
              ? 'Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.'
              : 'Nenhum cliente corresponde à busca.'}
          </div>
        ) : (
          <>
            <div className="table-scroll">
            <div className="ctable-head">
              <span>Nome</span>
              <span>CPF</span>
              <span>Telefone</span>
              <span>CNH</span>
              <span>Locações</span>
              <span>Score</span>
              <span />
            </div>
            {paginated.map(c => {
              const alert = cnhAlert(c.cnh_expiry)
              return (
                <div key={c.id} className="ctable-row gtable-row" onClick={() => openEdit(c)}>
                  <div>
                    <div className="gtable-cell" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.blacklisted && <span className="badge shop" style={{ fontSize: 10, padding: '2px 7px' }}>bloqueado</span>}
                      {c.name}
                    </div>
                    {c.email && <div className="gtable-muted">{c.email}</div>}
                  </div>
                  <div className="gtable-muted">{c.cpf ? maskCPF(c.cpf) : '—'}</div>
                  <div className="gtable-muted">{c.phone ? maskPhone(c.phone) : '—'}</div>
                  <div>
                    {c.cnh ? (
                      <>
                        <div className="gtable-muted">{c.cnh}</div>
                        {alert
                          ? <span className={alert.cls} style={{ fontSize: 10, padding: '2px 7px', marginTop: 2, display: 'inline-flex' }}>{alert.label}</span>
                          : c.cnh_expiry && <div className="gtable-muted">{formatDate(c.cnh_expiry)}</div>
                        }
                      </>
                    ) : (
                      <div className="gtable-muted">—</div>
                    )}
                  </div>
                  <div className="gtable-muted num">{c.rentals?.length ?? 0}</div>
                  <div>
                    <div className="score-val num" style={{ color: scoreColor(c.score ?? 100) }}>
                      {c.score ?? 100}
                    </div>
                    <div className="gtable-muted">{scoreLabel(c.score ?? 100)}</div>
                  </div>
                  <button
                    className="row-btn"
                    onClick={e => { e.stopPropagation(); openEdit(c) }}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )
            })}
            </div>
            <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0,0) }} />
          </>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? editing.name : 'Novo cliente'} wide>
        <form className="dash-form" onSubmit={handleSubmit}>

          <div className="form-row">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Nome completo <span className="req">*</span></label>
              <input type="text" placeholder="Maria Silva" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>CPF</label>
              <input type="text" placeholder="000.000.000-00" value={maskCPF(form.cpf)} onChange={e => setField('cpf', e.target.value.replace(/\D/g, ''))} maxLength={14} />
            </div>
            <div className="form-field">
              <label>E-mail</label>
              <input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setField('email', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Telefone / WhatsApp</label>
              <input type="text" placeholder="(00) 00000-0000" value={maskPhone(form.phone)} onChange={e => setField('phone', e.target.value.replace(/\D/g, ''))} maxLength={15} />
            </div>
            <div className="form-field">
              <label>Endereço</label>
              <input type="text" placeholder="Rua, número, bairro" value={form.address} onChange={e => setField('address', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Nº da CNH</label>
              <input type="text" placeholder="00000000000" value={form.cnh} onChange={e => setField('cnh', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Validade da CNH</label>
              <input type="date" value={form.cnh_expiry} onChange={e => setField('cnh_expiry', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Score de confiabilidade <span style={{ color: scoreColor(parseInt(form.score) || 0) }}>({parseInt(form.score) || 0})</span></label>
              <div className="score-slider-wrap">
                <input
                  type="range" min="0" max="100" step="1"
                  value={form.score}
                  onChange={e => setField('score', e.target.value)}
                  className="score-slider"
                  style={{ '--score-color': scoreColor(parseInt(form.score) || 0) }}
                />
                <div className="score-labels">
                  <span>Alto risco</span>
                  <span>Regular</span>
                  <span>Confiável</span>
                </div>
              </div>
            </div>
            <div className="form-field">
              <label>Status</label>
              <label className="toggle-row">
                <input type="checkbox" checked={form.blacklisted} onChange={e => setField('blacklisted', e.target.checked)} />
                <span className="toggle-label">Bloquear cliente</span>
              </label>
              {form.blacklisted && (
                <div style={{ marginTop: 8 }}>
                  <textarea placeholder="Motivo do bloqueio…" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {!form.blacklisted && (
            <div className="form-field">
              <label>Observações</label>
              <textarea placeholder="Anotações sobre o cliente…" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {editing && (
              deletingId === editing.id ? (
                <div className="delete-confirm">
                  <span>Excluir cliente?</span>
                  <button type="button" className="btn-danger-sm" onClick={() => handleDelete(editing.id)}>Sim, excluir</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setDeletingId(null)}>Cancelar</button>
                </div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setDeletingId(editing.id)}>Excluir</button>
              )
            )}
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar cliente'}
              </button>
            </div>
          </div>

        </form>
      </Modal>

    </DashboardLayout>
  )
}
