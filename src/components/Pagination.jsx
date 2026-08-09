export default function Pagination({ total, page, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="pagination">
      <button className="pag-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="pag-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pag-btn${p === page ? ' active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button className="pag-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      <span className="pag-info">{total} registro{total !== 1 ? 's' : ''}</span>
    </div>
  )
}
