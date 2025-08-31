// Performance optimization utilities
import { lazy, LazyExoticComponent, ComponentType } from 'react';

// Lazy loading with retry logic
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await importFn();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

// Image optimization
export interface OptimizedImageOptions {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export function getOptimizedImageUrl(options: OptimizedImageOptions): string {
  const { src, width, height, quality = 80, format = 'webp' } = options;
  
  // If using a CDN or image optimization service
  if (process.env.REACT_APP_IMAGE_CDN_URL) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('fm', format);
    
    return `${process.env.REACT_APP_IMAGE_CDN_URL}/${src}?${params.toString()}`;
  }
  
  return src;
}

// Intersection Observer for lazy loading
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options?: IntersectionObserverInit
): void {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbackRef.current();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);
}

// Virtual scrolling helper
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  items,
  overscan = 3
}: VirtualScrollOptions) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  };
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastUpdated = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const now = Date.now();
    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const id = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval);
      return () => clearTimeout(id);
    }
  }, [value, interval]);

  return throttledValue;
}

// Memory optimization - object pooling
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }
}

// Request Animation Frame optimization
export function rafThrottle<T extends (...args: any[]) => any>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: any[] | null = null;

  const throttled = (...args: any[]) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs!);
        rafId = null;
      });
    }
  };

  return throttled as T;
}

// Web Worker utility for heavy computations
export function createWorker<T, R>(
  workerFunction: (data: T) => R
): (data: T) => Promise<R> {
  const blob = new Blob([
    `self.onmessage = function(e) {
      const fn = ${workerFunction.toString()};
      const result = fn(e.data);
      self.postMessage(result);
    }`
  ], { type: 'application/javascript' });

  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);

  return (data: T) => {
    return new Promise<R>((resolve, reject) => {
      worker.onmessage = (e) => resolve(e.data);
      worker.onerror = reject;
      worker.postMessage(data);
    });
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure.duration;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    // Clean up
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  getReport(): Record<string, { average: number; count: number; total: number }> {
    const report: Record<string, { average: number; count: number; total: number }> = {};
    
    this.metrics.forEach((times, name) => {
      const total = times.reduce((a, b) => a + b, 0);
      report[name] = {
        average: total / times.length,
        count: times.length,
        total
      };
    });
    
    return report;
  }
}

import React from 'react';

// Prefetch resources
export function prefetchResource(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

// Preload critical resources
export function preloadResource(url: string, type: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
}