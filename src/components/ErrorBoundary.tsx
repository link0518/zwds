import { Component, type ReactNode } from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types';

/**
 * 错误边界组件
 *
 * 捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI。
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-lz-paper">
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-lz-red/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-lz-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-serif font-bold text-lz-ink mb-4 tracking-wider">
              天机有变
            </h2>

            <p className="text-lz-ink-light font-serif mb-6 leading-relaxed">
              命盘推演过程中遇到了一些问题，请稍后再试。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-lz-ink-lighter hover:text-lz-ink">
                  查看错误详情
                </summary>
                <pre className="mt-2 p-4 bg-lz-paper-dark rounded text-xs text-lz-ink-light overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary px-6 py-2 font-serif"
              >
                重新排盘
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-outline px-6 py-2 font-serif"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
