import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/vistoria.css'

// ─── Checklist items ──────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { key: 'pneus',         label: 'Pneus'                  },
  { key: 'rodas',         label: 'Rodas / Calotas'        },
  { key: 'parachoque_f',  label: 'Para-choque dianteiro'  },
  { key: 'parachoque_t',  label: 'Para-choque traseiro'   },
  { key: 'lataria',       label: 'Lataria'                },
  { key: 'vidros',        label: 'Vidros'                 },
  { key: 'retrovisores',  label: 'Retrovisores'           },
  { key: 'farois',        label: 'Faróis'                 },
  { key: 'lanternas',     label: 'Lanternas'              },
  { key: 'interior',      label: 'Interior / Bancos'      },
  { key: 'documentos',    label: 'Documentos do veículo'  },
  { key: 'macaco',        label: 'Macaco e chave de roda' },
  { key: 'triangulo',     label: 'Triângulo'              },
  { key: 'extintor',      label: 'Extintor'               },
]

const DEFAULT_ITEMS = Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, true]))

// ─── Helpers ─────────────────────────────────────────────────

function formatDateTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function fuelClass(pct) {
  if (pct >= 60) return 'full'
  if (pct >= 25) return 'medium'
  return 'low'
}

function checkedCount(items) {
  return Object.values(items || {}).filter(Boolean).length
}

function FuelBar({ level }) {
  return (
    <div className="fuel-gauge">
      <div className="fuel-bar-wrap">
        <div
          className={`fuel-bar-fill ${fuelClass(level)}`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="fuel-pct">{level}%</span>
    </div>
  )
}

const EMPTY = {
  rental_id:      '',
  vehicle_id:     '',
  type:           'pickup',
  mileage:        '',
  fuel_level:     100,
  clean:          true,
  items:          { ...DEFAULT_ITEMS },
  damages:        '',
  notes:          '',
  inspector_name: '',
}

// ─── Component ───────────────────────────────────────────────

export default function VistoriaPage() {
  const { userData }    = useUser()
  const [inspections, setInspections] = useState([])
  const [rentals, setRentals]         = useState([])
  const [vehicles, setVehicles]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [delConfirm, setDelConfirm]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ins }, { data: r }, { data: v }] = await Promise.all([
      supabase
        .from('inspections')
        .select('*, vehicles(plate, brand, model), rentals(id, start_date, customers(name))')
        .order('created_at', { ascending: false }),
      supabase
        .from('rentals')
        .select('id, start_date, customers(name), vehicles(plate)')
        .in('status', ['active', 'completed'])
        .order('start_date', { ascending: false }),
      supabase.from('vehicles').select('id, plate, brand, model').order('plate'),
    ])
    setInspections(ins || [])
    setRentals(r || [])
    setVehicles(v || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Filters ───────────────────────────────────────────────
  const byFilter = useMemo(() => {
    if (filter === 'all')    return inspections
    if (filter === 'pickup') return inspections.filter(i => i.type === 'pickup')
    return inspections.filter(i => i.type === 'return')
  }, [inspections, filter])

  const filtered = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(i =>
      `${i.vehicles?.plate || ''} ${i.vehicles?.brand || ''} ${i.vehicles?.model || ''} ${i.rentals?.customers?.name || ''} ${i.inspector_name || ''}`.toLowerCase().includes(q)
    )
  }, [byFilter, search])

  const counts = useMemo(() => ({
    all:    inspections.length,
    pickup: inspections.filter(i => i.type === 'pickup').length,
    return: inspections.filter(i => i.type === 'return').length,
  }), [inspections])

  // ── Modal ─────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal('add')
  }

  function openView(ins) {
    setForm({
      rental_id:      ins.rental_id      || '',
      vehicle_id:     ins.vehicle_id     || '',
      type:           ins.type           || 'pickup',
      mileage:        ins.mileage        ?? '',
      fuel_level:     ins.fuel_level     ?? 100,
      clean:          ins.clean          ?? true,
      items:          ins.items          || { ...DEFAULT_ITEMS },
      damages:        ins.damages        || '',
      notes:          ins.notes          || '',
      inspector_name: ins.inspector_name || '',
      _id:            ins.id,
      _readOnly:      true,
      _ins:           ins,
    })
    setError('')
    setDelConfirm(false)
    setModal('view')
  }

  function switchToEdit() {
    setForm(p => ({ ...p, _readOnly: false }))
    setModal('edit')
  }

  function handleVehicleChange(id) {
    setForm(p => ({ ...p, vehicle_id: id }))
  }

  function toggleItem(key) {
    setForm(p => ({ ...p, items: { ...p.items, [key]: !p.items[key] } }))
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.vehicle_id) { setError('Selecione o veículo.'); return }
    setSaving(true)
    const payload = {
      company_id:     userData.company.id,
      rental_id:      form.rental_id      || null,
      vehicle_id:     form.vehicle_id,
      type:           form.type,
      mileage:        form.mileage !== '' ? Number(form.mileage) : null,
      fuel_level:     Number(form.fuel_level),
      clean:          form.clean,
      items:          form.items,
      damages:        form.damages.trim()        || null,
      notes:          form.notes.trim()          || null,
      inspector_name: form.inspector_name.trim() || null,
    }
    if (modal === 'add') {
      const { error: err } = await supabase.from('inspections').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('inspections').update(payload).eq('id', form._id)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function del() {
    await supabase.from('inspections').delete().eq('id', form._id)
    setModal(null)
    load()
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Vistoria</h1>
      <p>{loading ? '…' : `${counts.pickup} entrega${counts.pickup !== 1 ? 's' : ''} · ${counts.return} devolução${counts.return !== 1 ? 'ões' : ''} registrada${counts.return !== 1 ? 's' : ''}`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Nova vistoria
    </button>
  )

  const isReadOnly = form._readOnly

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'all',    label: 'Todas',       count: counts.all    },
            { key: 'pickup', label: 'Entregas',    count: counts.pickup },
            { key: 'return', label: 'Devoluções',  count: counts.return },
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
            placeholder="Placa, cliente ou vistoriador…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando vistorias…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {inspections.length === 0 ? 'Nenhuma vistoria registrada.' : 'Nenhuma vistoria corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="itable-head">
              <span>Data</span>
              <span>Veículo</span>
              <span>Tipo</span>
              <span>Km</span>
              <span>Combustível</span>
              <span>Locação / Vistoriador</span>
              <span>Checklist</span>
              <span />
            </div>
            {filtered.map(ins => {
              const total   = CHECKLIST_ITEMS.length
              const checked = checkedCount(ins.items)
              const allOk   = checked === total
              return (
                <div key={ins.id} className="itable-row gtable-row" onClick={() => openView(ins)}>
                  <div className="gtable-muted">{formatDateTime(ins.created_at)}</div>
                  <div>
                    <div className="plate" style={{ fontSize: 11 }}>{ins.vehicles?.plate || '—'}</div>
                    <div className="gtable-muted">{ins.vehicles ? `${ins.vehicles.brand} ${ins.vehicles.model}` : ''}</div>
                  </div>
                  <span className={`insp-type-badge ${ins.type}`}>
                    {ins.type === 'pickup' ? 'Entrega' : 'Devolução'}
                  </span>
                  <div className="gtable-muted">{ins.mileage ? `${Number(ins.mileage).toLocaleString('pt-BR')} km` : '—'}</div>
                  <div style={{ minWidth: 80 }}>
                    <FuelBar level={ins.fuel_level} />
                  </div>
                  <div>
                    {ins.rentals?.customers?.name
                      ? <div className="gtable-cell">{ins.rentals.customers.name}</div>
                      : <div className="gtable-muted">—</div>
                    }
                    {ins.inspector_name && <div className="gtable-muted">{ins.inspector_name}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: allOk ? 'var(--emerald)' : checked < total * 0.7 ? 'var(--danger)' : 'var(--amber)',
                    }}>
                      {checked}/{total}
                    </span>
                    {ins.damages && <span className="damage-tag">danos</span>}
                  </div>
                  <button className="row-btn" onClick={e => { e.stopPropagation(); openView(ins) }} title="Ver">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'view' ? 'Vistoria' : modal === 'add' ? 'Nova vistoria' : 'Editar vistoria'}
        wide
      >
        <form className="dash-form" onSubmit={isReadOnly ? e => e.preventDefault() : save}>

          {/* Tipo + veículo + locação */}
          <div className="form-row">
            <div className="form-field">
              <label>Tipo de vistoria *</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                disabled={isReadOnly}
              >
                <option value="pickup">Entrega (saída)</option>
                <option value="return">Devolução (retorno)</option>
              </select>
            </div>
            <div className="form-field">
              <label>Veículo *</label>
              <select
                value={form.vehicle_id}
                onChange={e => handleVehicleChange(e.target.value)}
                required
                disabled={isReadOnly}
              >
                <option value="">Selecionar…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Locação associada</label>
              <select
                value={form.rental_id}
                onChange={e => setForm(p => ({ ...p, rental_id: e.target.value }))}
                disabled={isReadOnly}
              >
                <option value="">Nenhuma</option>
                {rentals.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.customers?.name} — {r.vehicles?.plate} ({formatDate(r.start_date)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Vistoriador</label>
              <input
                value={form.inspector_name}
                onChange={e => setForm(p => ({ ...p, inspector_name: e.target.value }))}
                placeholder="Nome de quem fez a vistoria"
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Km + combustível */}
          <div className="form-row">
            <div className="form-field">
              <label>Quilometragem</label>
              <input
                type="number"
                value={form.mileage}
                onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))}
                placeholder="Ex: 45000"
                min="0"
                disabled={isReadOnly}
              />
            </div>
            <div className="form-field">
              <label>Nível de combustível — {form.fuel_level}%</label>
              <div className="fuel-slider-wrap">
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={form.fuel_level}
                  onChange={e => setForm(p => ({ ...p, fuel_level: Number(e.target.value) }))}
                  className="fuel-slider"
                  disabled={isReadOnly}
                />
                <div className="fuel-icons">
                  <span>Vazio</span>
                  <FuelBar level={form.fuel_level} />
                  <span>Cheio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Limpeza */}
          <label className="toggle-row" style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              checked={form.clean}
              onChange={e => !isReadOnly && setForm(p => ({ ...p, clean: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: '#10b981', cursor: isReadOnly ? 'default' : 'pointer' }}
              readOnly={isReadOnly}
            />
            <span className="toggle-label">Veículo limpo na vistoria</span>
          </label>

          {/* Checklist */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Checklist — {checkedCount(form.items)}/{CHECKLIST_ITEMS.length} itens ok
            </div>
            <div className="checklist-grid">
              {CHECKLIST_ITEMS.map(item => (
                <label
                  key={item.key}
                  className={`check-item${form.items[item.key] ? ' checked' : ''}`}
                  style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={!!form.items[item.key]}
                    onChange={() => !isReadOnly && toggleItem(item.key)}
                    readOnly={isReadOnly}
                  />
                  <span className="check-item-label">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Danos */}
          <div className="form-field">
            <label>Danos / Avarias observadas</label>
            <textarea
              value={form.damages}
              onChange={e => setForm(p => ({ ...p, damages: e.target.value }))}
              placeholder="Descreva riscos, amassados, quebras ou qualquer irregularidade encontrada…"
              rows={2}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-field">
            <label>Observações gerais</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Informações adicionais…"
              rows={2}
              disabled={isReadOnly}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {modal === 'view' ? (
              <>
                {delConfirm ? (
                  <div className="delete-confirm">
                    Excluir vistoria?
                    <button type="button" className="btn-danger-sm" onClick={del}>Sim</button>
                    <button type="button" className="btn-ghost-sm" onClick={() => setDelConfirm(false)}>Não</button>
                  </div>
                ) : (
                  <button type="button" className="btn-danger-ghost" onClick={() => setDelConfirm(true)}>Excluir</button>
                )}
                <div className="form-actions-end">
                  <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Fechar</button>
                  <button type="button" className="btn-save" onClick={switchToEdit}>Editar</button>
                </div>
              </>
            ) : (
              <>
                {modal === 'edit' && (
                  delConfirm ? (
                    <div className="delete-confirm">
                      Excluir vistoria?
                      <button type="button" className="btn-danger-sm" onClick={del}>Sim</button>
                      <button type="button" className="btn-ghost-sm" onClick={() => setDelConfirm(false)}>Não</button>
                    </div>
                  ) : (
                    <button type="button" className="btn-danger-ghost" onClick={() => setDelConfirm(true)}>Excluir</button>
                  )
                )}
                <div className="form-actions-end">
                  <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? 'Salvando…' : modal === 'add' ? 'Salvar vistoria' : 'Salvar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}
