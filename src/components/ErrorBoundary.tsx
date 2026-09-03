import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 出错区域名称，便于定位 */
  label?: string;
  /** 自定义兜底 UI；不传则用默认恢复面板 */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 错误边界：任意子组件渲染异常都会被拦截，
 * 避免出现整页空白 / 黑屏，用户可直接重试或刷新。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const payload = {
      label: this.props.label ?? 'unknown',
      message: error?.message ?? String(error),
      stack: error?.stack,
      componentStack: info?.componentStack,
      at: Date.now()
    };
    console.error('[ErrorBoundary]', payload);
    (window as any).__lastError = payload;
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="err-fallback">
          <h3>{this.props.label ?? '此区域'}出错了</h3>
          <p className="err-msg">{this.state.error.message}</p>
          <div className="row-gap">
            <button className="primary" onClick={() => this.setState({ error: null })}>
              重试
            </button>
            <button className="mini" onClick={() => location.reload()}>
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
