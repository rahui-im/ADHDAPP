// React Component Optimization Utilities
import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualScroll } from './performance';

// Memoized component with custom comparison
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, propsAreEqual);
}

// Deep memo comparison
export function deepMemo<P extends object>(Component: React.ComponentType<P>) {
  return memo(Component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}

// Virtualized List Component
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 600,
  className = ''
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex
  } = useVirtualScroll({
    items,
    itemHeight,
    containerHeight
  });

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lazy Image Component
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
  className = '',
  width,
  height,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      onLoad?.();
    };
    img.onerror = () => {
      onError?.();
    };
  }, [isInView, src, onLoad, onError]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
    />
  );
});

// Optimized Form Input
interface OptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
}

export const OptimizedInput: React.FC<OptimizedInputProps> = memo(({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(e);

    if (onDebouncedChange) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onDebouncedChange(newValue);
      }, debounceMs);
    }
  }, [onChange, onDebouncedChange, debounceMs]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
});

// Heavy Computation Hook with Memoization
export function useHeavyComputation<T, D extends readonly unknown[]>(
  computeFn: (...deps: D) => T,
  deps: D
): T {
  return useMemo(() => computeFn(...deps), deps);
}

// Batch State Updates
export function useBatchState<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }, 0);
  }, []);

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(prev => ({ ...prev, ...pendingUpdates.current }));
    pendingUpdates.current = {};
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate, flushUpdates];
}

// Progressive Enhancement Component
interface ProgressiveEnhancementProps {
  basic: React.ReactNode;
  enhanced: React.ReactNode;
  checkSupport: () => boolean;
}

export const ProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> = ({
  basic,
  enhanced,
  checkSupport
}) => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(checkSupport());
  }, [checkSupport]);

  return <>{isSupported ? enhanced : basic}</>;
};

// Optimized Context Provider
export function createOptimizedContext<T>() {
  const Context = React.createContext<T | undefined>(undefined);

  const Provider: React.FC<{ value: T; children: React.ReactNode }> = memo(
    ({ value, children }) => (
      <Context.Provider value={value}>{children}</Context.Provider>
    ),
    (prevProps, nextProps) => {
      return JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value);
    }
  );

  const useOptimizedContext = () => {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error('useOptimizedContext must be used within a Provider');
    }
    return context;
  };

  return [Provider, useOptimizedContext] as const;
}

// Code Splitting Boundary
interface CodeSplitBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  errorFallback?: React.ReactNode;
}

interface CodeSplitBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class CodeSplitBoundary extends React.Component<
  CodeSplitBoundaryProps,
  CodeSplitBoundaryState
> {
  constructor(props: CodeSplitBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CodeSplitBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Code split boundary error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.errorFallback || <div>Error loading component</div>;
    }

    return (
      <React.Suspense fallback={this.props.fallback || <div>Loading...</div>}>
        {this.props.children}
      </React.Suspense>
    );
  }
}