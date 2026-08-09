import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/contratos.css'

async function generateContractPDF(rental, company) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF()
  const num   = contractNumber(rental.id, rental.created_at)
  const total = calcTotal(rental)
  const days  = Math.max(1, Math.ceil((new Date(rental.expected_end) - new Date(rental.start_date)) / 86400000))

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10)
  doc.text('WMove', 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(company?.name || 'Locadora', 14, 27)
  if (company?.cnpj) doc.text(`CNPJ ${company.cnpj}`, 14, 33)

  doc.setFontSize(10)
  doc.setTextColor(50)
  doc.text(`Contrato ${num}`, 196, 20, { align: 'right' })
  doc.text(`Emitido em ${formatDate(rental.start_date)}`, 196, 27, { align: 'right' })

  doc.setDrawColor(220)
  doc.line(14, 38, 196, 38)

  autoTable(doc, {
    startY: 44,
    head: [['Locadora', 'Locatário']],
    body: [[
      [company?.name || '—', company?.cnpj ? `CNPJ: ${company.cnpj}` : ''].filter(Boolean).join('\n'),
      [
        rental.customers?.name || '—',
        rental.customers?.cpf
          ? `CPF: ${rental.customers.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`
          : '',
      ].filter(Boolean).join('\n'),
    ]],
    theme: 'plain',
    headStyles: { fillColor: [245, 158, 11], textColor: [10, 12, 20], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 10, minCellHeight: 14, valign: 'middle' },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Placa', 'Veículo', 'Início', 'Devolução prev.', 'Dias', 'Diária', 'Total']],
    body: [[
      rental.vehicles?.plate || '—',
      rental.vehicles ? `${rental.vehicles.brand} ${rental.vehicles.model}` : '—',
      formatDate(rental.start_date),
      formatDate(rental.expected_end),
      `${days}d`,
      formatMoney(rental.daily_rate),
      formatMoney(total),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [31, 35, 43], textColor: [229, 231, 235], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
  })

  const afterTable = doc.lastAutoTable.finalY

  if (rental.notes) {
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text('Observações:', 14, afterTable + 12)
    doc.setTextColor(60)
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(rental.notes, 170)
    doc.text(lines, 14, afterTable + 19)
  }

  const sigY = Math.max(afterTable + (rental.notes ? 50 : 30), 220)
  doc.setDrawColor(160)
  doc.line(20, sigY, 90, sigY)
  doc.line(110, sigY, 180, sigY)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text('Locadora', 55, sigY + 7, { align: 'center' })
  doc.text('Locatário', 145, sigY + 7, { align: 'center' })

  doc.save(`contrato-${num}.pdf`)
}

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_MAP = {
  active:    { cls: 'rented', label: 'vigente'   },
  completed: { cls: 'avail',  label: 'encerrado' },
  cancelled: { cls: 'shop',   label: 'cancelado' },
}

function contractNumber(id, createdAt) {
  const d = new Date(createdAt)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `WM${yy}${mm}-${id.slice(0, 6).toUpperCase()}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatMoney(val) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function calcTotal(r) {
  if (r.status === 'completed' && r.total_amount) return Number(r.total_amount)
  const days = Math.max(1, Math.ceil((new Date(r.expected_end) - new Date(r.start_date)) / 86400000))
  return days * Number(r.daily_rate)
}

// ─── Contract Preview ─────────────────────────────────────────

function ContractPreview({ rental, company }) {
  if (!rental) return null
  const total  = calcTotal(rental)
  const days   = Math.max(1, Math.ceil((new Date(rental.expected_end) - new Date(rental.start_date)) / 86400000))
  const num    = contractNumber(rental.id, rental.created_at)

  return (
    <div className="contract-doc">
      <div className="contract-doc-head">
        <div>
          <div className="contract-doc-logo">WMove</div>
          <div className="contract-doc-company">{company?.name || 'Locadora'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="contract-doc-num">Contrato {num}</div>
          <div className="contract-doc-date">Emitido em {formatDate(rental.start_date)}</div>
          <span className={`badge ${STATUS_MAP[rental.status]?.cls}`} style={{ marginTop: 6, display: 'inline-flex' }}>
            {STATUS_MAP[rental.status]?.label}
          </span>
        </div>
      </div>

      <div className="contract-section-title">Partes</div>
      <div className="contract-grid-2">
        <div className="contract-field">
          <div className="contract-field-label">Locadora</div>
          <div className="contract-field-val">{company?.name || '—'}</div>
          {company?.cnpj && <div className="contract-field-sub">CNPJ {company.cnpj}</div>}
        </div>
        <div className="contract-field">
          <div className="contract-field-label">Locatário</div>
          <div className="contract-field-val">{rental.customers?.name || '—'}</div>
          {rental.customers?.cpf && (
            <div className="contract-field-sub">
              CPF {rental.customers.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
            </div>
          )}
        </div>
      </div>

      <div className="contract-section-title">Veículo</div>
      <div className="contract-grid-2">
        <div className="contract-field">
          <div className="contract-field-label">Placa</div>
          <div className="contract-field-val">{rental.vehicles?.plate || '—'}</div>
        </div>
        <div className="contract-field">
          <div className="contract-field-label">Modelo</div>
          <div className="contract-field-val">{rental.vehicles ? `${rental.vehicles.brand} ${rental.vehicles.model}` : '—'}</div>
        </div>
      </div>

      <div className="contract-section-title">Condições</div>
      <div className="contract-grid-4">
        <div className="contract-field">
          <div className="contract-field-label">Início</div>
          <div className="contract-field-val">{formatDate(rental.start_date)}</div>
        </div>
        <div className="contract-field">
          <div className="contract-field-label">Devolução prev.</div>
          <div className="contract-field-val">{formatDate(rental.expected_end)}</div>
        </div>
        <div className="contract-field">
          <div className="contract-field-label">Prazo</div>
          <div className="contract-field-val">{days} dia{days !== 1 ? 's' : ''}</div>
        </div>
        <div className="contract-field">
          <div className="contract-field-label">Diária</div>
          <div className="contract-field-val num">{formatMoney(rental.daily_rate)}</div>
        </div>
      </div>

      {rental.notes && (
        <>
          <div className="contract-section-title">Observações</div>
          <div className="contract-notes">{rental.notes}</div>
        </>
      )}

      <div className="contract-total-row">
        <span>Valor total do contrato</span>
        <span className="num">{formatMoney(total)}</span>
      </div>

      <div className="contract-sig-row">
        <div className="contract-sig">
          <div className="contract-sig-line" />
          <div>Locadora</div>
        </div>
        <div className="contract-sig">
          <div className="contract-sig-line" />
          <div>Locatário</div>
        </div>
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────

export default function ContratosPage() {
  const { userData } = useUser()
  const [rentals, setRentals]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [preview, setPreview]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('rentals')
      .select('*, customers(name, cpf), vehicles(plate, brand, model)')
      .order('created_at', { ascending: false })
    setRentals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const byFilter = filter === 'all' ? rentals : rentals.filter(r => r.status === filter)
  const filtered = search.trim()
    ? byFilter.filter(r =>
        `${r.customers?.name || ''} ${r.vehicles?.plate || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : byFilter

  const counts = {
    all:       rentals.length,
    active:    rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Contratos</h1>
      <p>{loading ? '…' : `${rentals.length} contrato${rentals.length !== 1 ? 's' : ''} gerado${rentals.length !== 1 ? 's' : ''}`}</p>
    </div>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft}>

      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'all',       label: 'Todos',      count: counts.all       },
            { key: 'active',    label: 'Vigentes',   count: counts.active    },
            { key: 'completed', label: 'Encerrados', count: counts.completed },
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
            placeholder="Buscar por cliente ou placa…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando contratos…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {rentals.length === 0 ? 'Nenhum contrato gerado ainda.' : 'Nenhum contrato corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="kontable-head">
              <span>Nº Contrato</span>
              <span>Cliente</span>
              <span>Veículo</span>
              <span>Início</span>
              <span>Encerramento</span>
              <span>Valor</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map(r => {
              const s   = STATUS_MAP[r.status] || { cls: 'shop', label: r.status }
              const num = contractNumber(r.id, r.created_at)
              return (
                <div key={r.id} className="kontable-row gtable-row" onClick={() => setPreview(r)}>
                  <div className="contract-num-cell num">{num}</div>
                  <div className="gtable-cell">{r.customers?.name || '—'}</div>
                  <div>
                    <div className="plate" style={{ fontSize: 11 }}>{r.vehicles?.plate || '—'}</div>
                    <div className="gtable-muted">{r.vehicles ? `${r.vehicles.brand} ${r.vehicles.model}` : ''}</div>
                  </div>
                  <div className="gtable-muted">{formatDate(r.start_date)}</div>
                  <div className="gtable-muted">{formatDate(r.end_date || r.expected_end)}</div>
                  <div className="gtable-cell num" style={{ fontSize: 13.5, fontWeight: 500 }}>{formatMoney(calcTotal(r))}</div>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  <button className="row-btn" onClick={e => { e.stopPropagation(); setPreview(r) }} title="Ver contrato">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/>
                      <path d="M14 3v5h5M9 13h6M9 17h6"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </>
        )}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Visualizar contrato" wide>
        <ContractPreview rental={preview} company={userData?.company} />
        <div className="form-actions" style={{ marginTop: 20 }}>
          <div className="form-actions-end">
            <button className="btn-cancel" onClick={() => setPreview(null)}>Fechar</button>
            <button className="btn-cancel" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir
            </button>
            <button className="btn-save" onClick={() => generateContractPDF(preview, userData?.company)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar PDF
            </button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  )
}
