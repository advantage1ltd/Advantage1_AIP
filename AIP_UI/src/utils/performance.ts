import { useEffect } from 'react';

// Performance monitoring utilities that won't affect existing code
interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  startMetric(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    try {
      this.metrics.set(name, {
        name,
        startTime: window.performance.now(),
        metadata
      });
    } catch (error) {
      console.warn('Failed to start metric:', error);
    }
  }

  endMetric(name: string) {
    if (!this.enabled) return;

    try {
      const metric = this.metrics.get(name);
      if (metric) {
        metric.duration = window.performance.now() - metric.startTime;
        this.logMetric(metric);
      }
    } catch (error) {
      console.warn('Failed to end metric:', error);
    }
  }

  private logMetric(metric: PerformanceMetric) {
    if (!this.enabled) return;

    try {
      console.log(`Performance Metric - ${metric.name}:`, {
        duration: `${metric.duration?.toFixed(2)}ms`,
        ...metric.metadata
      });

      // In production, you would send this to your analytics service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to analytics
        // analyticsService.logPerformance(metric);
      }
    } catch (error) {
      console.warn('Failed to log metric:', error);
    }
  }
}

// Safe hooks for React components
export const usePerformanceMonitoring = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    try {
      monitor.startMetric(`${componentName}_mount`);
      return () => {
        monitor.endMetric(`${componentName}_mount`);
      };
    } catch (error) {
      console.warn('Performance monitoring error:', error);
    }
  }, [componentName]);

  return {
    logOperation: (operationName: string, operation: () => void) => {
      try {
        monitor.startMetric(`${componentName}_${operationName}`);
        operation();
        monitor.endMetric(`${componentName}_${operationName}`);
      } catch (error) {
        console.warn('Operation logging error:', error);
        operation();
      }
    },
    logAsync: async <T,>(operationName: string, operation: () => Promise<T>): Promise<T> => {
      try {
        monitor.startMetric(`${componentName}_${operationName}`);
        const result = await operation();
        monitor.endMetric(`${componentName}_${operationName}`);
        return result;
      } catch (error) {
        monitor.endMetric(`${componentName}_${operationName}`);
        throw error;
      }
    }
  };
};

// Export singleton instance
export const performance = PerformanceMonitor.getInstance(); 