import { Component } from 'react'

/**
 * App-level error boundary. If any render throws (e.g. an unexpected data
 * shape), show a recovery screen with the option to clear stored data —
 * never a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surface for debugging; safe to keep in production.
    console.error('Dashboard render error:', error, info)
  }

  handleReset = () => {
    try {
      localStorage.removeItem('threads-analytics.posts.v1')
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  handleReload = () => window.location.reload()

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: 'var(--bg, #f7f8f7)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 460,
            textAlign: 'center',
            background: '#fff',
            border: '1px solid #e7ebe8',
            borderRadius: 16,
            padding: '32px 28px',
            boxShadow: '0 8px 28px rgba(14,21,18,0.12)',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#fbebe6',
              color: '#b4402a',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              fontSize: 26,
              fontWeight: 700,
            }}
            aria-hidden
          >
            !
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#0e1512' }}>Something went wrong</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#5d6b63', lineHeight: 1.6 }}>
            The dashboard hit an unexpected error while loading your data. You can reload the page, or reset the stored
            data if the problem persists. Resetting removes posts saved in this browser only.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReload}
              style={{
                border: '1px solid #d6ddd8',
                background: '#fff',
                color: '#1b2420',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            <button
              onClick={this.handleReset}
              style={{
                border: '1px solid #045a26',
                background: '#045a26',
                color: '#fff',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset stored data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
