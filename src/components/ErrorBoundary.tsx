import { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: any) { console.error('Boundary caught:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: '#F5F1EA', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ color: '#E5544B', fontWeight: 700, marginBottom: 8 }}>Page crashed:</div>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#A1A1AA' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#5C5C5C', fontSize: 11, marginTop: 12 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
