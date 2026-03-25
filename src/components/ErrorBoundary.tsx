import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl p-8 border border-rose-100 dark:border-rose-900/30 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </div>
            
            <h1 className="text-2xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">
              Ops! Algo correu mal.
            </h1>
            
            <p className="text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
              Ocorreu um erro inesperado na aplicação. Por favor, tente recarregar a página ou voltar para o início.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-rose-600 dark:text-rose-400">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
              >
                <RefreshCw className="h-5 w-5" />
                Recarregar Página
              </button>
              
              <button 
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95"
              >
                <Home className="h-5 w-5" />
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
