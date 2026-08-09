import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0A0C14', gap: 16, padding: 24,
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ color: '#F4F4F5', fontSize: 16, fontWeight: 600, margin: 0 }}>Algo deu errado</p>
          <p style={{ color: 'rgba(244,244,245,0.5)', fontSize: 13, margin: 0, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'Erro desconhecido'}
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              marginTop: 8, padding: '10px 20px', borderRadius: 10,
              background: '#F59E0B', color: '#0A0C14', border: 'none',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
