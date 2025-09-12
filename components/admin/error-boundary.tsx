'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidMount() {
    // capture uncaught errors and unhandled promise rejections
    (window as any).__errorBoundaryOnError = (msg: string | Event, url?: string, line?: number, col?: number, err?: Error) => {
      console.error('window.onerror captured:', msg, err);
      this.setState({ hasError: true, error: err instanceof Error ? err : new Error(String(msg)) });
      return false;
    };
    (window as any).__errorBoundaryOnUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('unhandledrejection captured:', event.reason);
      this.setState({ hasError: true, error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)) });
    };
    window.addEventListener('error', (window as any).__errorBoundaryOnError as EventListener)
    window.addEventListener('unhandledrejection', (window as any).__errorBoundaryOnUnhandledRejection as EventListener)
  }

  componentWillUnmount() {
    if ((window as any).__errorBoundaryOnError) window.removeEventListener('error', (window as any).__errorBoundaryOnError as EventListener)
    if ((window as any).__errorBoundaryOnUnhandledRejection) window.removeEventListener('unhandledrejection', (window as any).__errorBoundaryOnUnhandledRejection as EventListener)
    ;(window as any).__errorBoundaryOnError = undefined
    ;(window as any).__errorBoundaryOnUnhandledRejection = undefined
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-card/95 backdrop-blur-sm border rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4"
          >
            {/* Logo */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <Image
                src="/lightlogo.png"
                alt="Whispr Logo"
                width={60}
                height={60}
                className="dark:hidden"
              />
              <Image
                src="/darklogo.png"
                alt="Whispr Logo"
                width={60}
                height={60}
                className="hidden dark:block"
              />
            </motion.div>

            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Oops! Something went wrong
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-center mb-6"
            >
              We encountered an unexpected error. Don't worry, our team has been notified.
            </motion.p>

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-muted/50 rounded-lg p-4 mb-6 max-h-32 overflow-y-auto"
              >
                <div className="flex items-center mb-2">
                  <Bug className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Error Details</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {this.state.error.message}
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={this.handleRetry}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </motion.div>

            {/* Calming Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <p className="text-sm text-muted-foreground italic">
                "Every great story has its plot twists... let's try that again! 📖"
              </p>
            </motion.div>

            {/* Floating Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-destructive/20 rounded-full"
                  initial={{
                    x: Math.random() * 100 + "%",
                    y: "100%",
                    opacity: 0
                  }}
                  animate={{
                    y: "-100%",
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 4,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 3
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
