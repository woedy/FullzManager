import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-red-400 p-10 font-mono">
                    <h1 className="text-2xl font-bold mb-4">React Runtime Error</h1>
                    <div className="bg-slate-800 p-6 rounded-lg border border-red-500/30">
                        <pre className="whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
