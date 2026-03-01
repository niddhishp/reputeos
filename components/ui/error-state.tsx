import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * Error State Component
 * 
 * Displays when an error occurs, with optional retry action.
 * Shows error details in development mode.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load data"
 *   description="Please check your connection and try again."
 *   error={error}
 *   retry={refetch}
 * />
 * ```
 */

interface ErrorStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** The error object (shown in development) */
  error?: Error | null;
  /** Retry callback */
  retry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact variant */
  compact?: boolean;
  /** Full page variant */
  fullPage?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content.',
  error,
  retry,
  className,
  compact = false,
  fullPage = false,
}: ErrorStateProps) {
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        fullPage ? 'min-h-screen p-8' : compact ? 'p-4' : 'p-8',
        className
      )}
    >
      <div 
        className={cn(
          'rounded-full bg-red-100 flex items-center justify-center mb-4',
          compact ? 'p-3' : 'p-4'
        )}
      >
        <AlertCircle className={cn(
          'text-red-600',
          compact ? 'h-6 w-6' : 'h-8 w-8'
        )} />
      </div>
      
      <h3 className={cn(
        'font-semibold text-foreground mb-2',
        compact ? 'text-base' : 'text-lg'
      )}>
        {title}
      </h3>
      
      <p className={cn(
        'text-muted-foreground mb-4 max-w-sm',
        compact ? 'text-sm' : 'text-base'
      )}>
        {description}
      </p>
      
      {/* Show error details in development */}
      {isDev && error && (
        <div className="w-full max-w-lg mb-4">
          <details className="text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto max-h-48">
              <code className="text-red-600">
                {error.message}
                {'\n'}
                {error.stack}
              </code>
            </pre>
          </details>
        </div>
      )}
      
      {retry && (
        <Button 
          onClick={retry} 
          variant="outline"
          size={compact ? 'sm' : 'default'}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
