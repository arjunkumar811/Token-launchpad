import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid #ffcdd2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#b71c1c' }}>Something went wrong</h2>
          <p style={{ marginBottom: '15px' }}>The application encountered an error. Please refresh the page and try again.</p>
          {this.state.error && (
            <details style={{ 
              whiteSpace: 'pre-wrap', 
              backgroundColor: '#fff', 
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginTop: '10px'
            }}>
              <summary style={{ cursor: 'pointer', color: '#d32f2f', fontWeight: 'bold' }}>
                Error Details
              </summary>
              <p style={{ margin: '10px 0' }}>{this.state.error.toString()}</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </p>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;