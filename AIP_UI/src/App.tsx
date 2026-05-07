import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerSelectionProvider } from './contexts/CustomerSelectionContext';
import { RouterProvider } from 'react-router-dom';
import router from './routes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error Boundary State interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component with enhanced logging
class ErrorBoundaryComponent extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error details:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-muted-foreground">{this.state.error?.message}</p>
          <pre className="mt-2 max-w-full overflow-auto bg-gray-100 p-4 text-sm">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <Provider store={store}>
      <ErrorBoundaryComponent>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="aip-theme">
            <AuthProvider>
              <CustomerSelectionProvider>
                <RouterProvider router={router} />
              </CustomerSelectionProvider>
            </AuthProvider>
            <Toaster />
            <ToastContainer />
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ErrorBoundaryComponent>
    </Provider>
  );
}

export default App;

